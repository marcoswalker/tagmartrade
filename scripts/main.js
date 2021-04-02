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
    if (game.system.id === "tagmar_rpg" || game.system.id === "tagmar") {
        game.socket.on('module.tagmartrade', tradeData => {
            recebeSocket(tradeData);
        });
    } else {
        return ui.notifications.error("O módulo Tagmar Transações, só funciona com o sistema Tagmar.");
    }
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
    const chatData = {
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({
            actor: game.user.character
        })
    };
    chatData.content = "<p><img src='"+ actor.img +"' style='float: left; margin-left: auto; margin-right: auto; width: 40%;border: 0px;' /><img src='systems/tagmar_rpg/assets/TAGMAR FOUNDRY.png' style='float: left;margin-top:25px; margin-left: auto; margin-right: auto; width: 20%;border: 0px;'/><img src='"+ targetActor.img +"' style='float: left; width: 40%; margin-left: auto; margin-right: auto;border: 0px;' /></p><p class='rola_desc' style='display: block;margin-left:auto;margin-right:auto;margin-top:50%;'>"+ "<b>" + actor.data.name + "</b> acaba de presentear <b>"+ targetActor.data.name +"</b> com "+ String(tradeData.quant) +" <b>"+ itemquevai.data.name +"</b>." +"</p>";
    ChatMessage.create(chatData);
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