Hooks.on("renderActorSheet", function (sheet, html, character) {
    if (character.actor.type !== "Personagem") return;
    for (let ht of html.find(".movePertence")) {
        if ($(ht).attr('title') === "Mover para Transporte") {
            $('<a style="margin-left:5px;" class="tradePertence" title="Mandar para amigo" data-actor-id="'+ character.actor._id +'" data-item-id="'+ ht.dataset.itemId +'"><i class="fas fa-handshake"></i></a>').insertAfter(ht);
        }
    }
    html.find(".tradePertence").click(mandaPertence.bind(this));
});

Hooks.on("ready", function () {
    game.socket.on('module.tagmartrade', tradeData => {
        recebeSocket(tradeData);
    });
});

function recebeSocket(tradeData) {
    if (game.user.character === null) return;
    const targetActor = game.actors.get(tradeData.targetActor);
    if (game.user.character !== targetActor) return;
    const actor = game.actors.get(tradeData.currentActor);
    const item = actor.getOwnedItem(tradeData.item);
    let itemquevai = item;
    itemquevai.data.data.quant = tradeData.quant;
    itemquevai._data.data.quant = tradeData.quant;
    targetActor.createOwnedItem(itemquevai);
}

function mandaPertence(event) {
    if (game.user.character === null || game.user.isGM) return ui.notifications.info("Apenas para jogadores.");
    const currentActor = $(event.currentTarget).data("actorId");
    const itemId = $(event.currentTarget).data("itemId");
    const actor = game.actors.get(currentActor);
    const item = actor.getOwnedItem(itemId);
    const items = duplicate(item);
    const users = game.users;
    let dialog = new Dialog({
        title: "Enviar item para jogador",
        content: "<div><label style='margin-right:10px;' class='mediaeval'>Quantidade:</label><input class='quant' type='number' id='quantPert' style='width:40px;'/><label style='margin-right:10px;margin-left:10px;' class='mediaeval'>Jogador:</label><select id='userSelectx' class='users_names'></select></div>",
        buttons: {
            sim : {
                icon: '<i class="fas fa-check"></i>',
                label: "Enviar",
                callback: () => {
                    let quant = parseInt($('.quant').val());
                    const user = game.users.get($('.users_names').val());
                    if (quant > 0 && user !== null) {
                        if (quant > items.data.quant){
                            ui.notifications.warn("Você não pode enviar mais itens que você tem!");
                        } else if (quant == items.data.quant) {
                            const tradeData = {
                                item: items._id,
                                currentActor: currentActor,
                                targetActor: user.character._id,
                                quant: quant
                            };
                            game.socket.emit('module.tagmartrade', tradeData);
                            actor.deleteOwnedItem(itemId);
                        } else {
                            const tradeData = {
                                item: items._id,
                                currentActor: currentActor,
                                targetActor: user.character._id,
                                quant: quant
                            };
                            game.socket.emit('module.tagmartrade', tradeData);
                            item.update({'data.quant': items.data.quant - quant});
                        }
                    } else if (user === null) {
                        ui.notifications.warn("Tem que ter outro jogador online!");
                    } else ui.notifications.warn("Escolha um valor maior que zero!");
                }
            },
            nao : {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancelar",
                callback: () => {}
            }
        },
        default: "nao",
        render: html => {
            for (let user of users) {
                if (user.active && user.character !== null && user !== game.user && !user.isGM) $('.users_names').append("<option value='"+user.data._id+"'>"+user.data.name+"</option>");
            }
        },
    });
    dialog.render(true);
}