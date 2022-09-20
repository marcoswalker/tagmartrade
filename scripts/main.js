Hooks.on("renderActorSheet", function (sheet, html, character) {
    if (character.document.type !== "Personagem") return;
    for (let ht of html.find(".movePertence")) {
        if ($(ht).attr('title') === "Mover para Transporte") {
            $('<a style="margin-left:5px;" class="tradePertence" title="Mandar para amigo" data-actor-id="'+ character.document.id +'" data-item-id="'+ ht.dataset.itemId +'"><i class="fas fa-handshake"></i></a>').insertAfter(ht);
        }
    }
    html.find(".tradePertence").click(mandaPertence.bind(this));
});

Hooks.on("ready", function () {
    if (game.system.id === "tagmar_rpg" || game.system.id === "tagmar") {
        game.socket.on('module.tagmartrade', tradeData => {
            if (tradeData.type == "trade") recebeSocket(tradeData);
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
    let itemquevai = tradeData.itemc;
    itemquevai.system.quant = tradeData.quant;
    targetActor.createEmbeddedDocuments("Item", [itemquevai]);//targetActor.createOwnedItem(itemquevai);
    const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({
            actor: game.user.character
        })
    };
    chatData.content = "<p class='mediaeval'><img src='"+ actor.img +"' style='float: left; margin-left: auto; margin-right: auto; width: 40%;border: 0px;' /><img src='systems/"+ game.system.id +"/assets/TAGMAR FOUNDRY.png' style='float: left;margin-top:25px; margin-left: auto; margin-right: auto; width: 20%;border: 0px;'/><img src='"+ targetActor.img +"' style='float: left; width: 40%; margin-left: auto; margin-right: auto;border: 0px;' /></p><p class='rola_desc' style='display: block;margin-left:auto;margin-right:auto;margin-top:60%;'>"+ "<b>" + actor.name + "</b> acaba de presentear <b>"+ targetActor.name +"</b> com <b>"+ String(tradeData.quant) +"</b> <b>"+ itemquevai.name +"</b>." +"</p>";
    ChatMessage.create(chatData);
    ui.notifications.info("Você acaba de receber " + tradeData.quant + " " + itemquevai.name + " de " + actor.name);
}

function mandaPertence(event) {
    //if (game.user.character === null || game.user.isGM) return ui.notifications.info("Apenas para jogadores.");
    const currentActor = $(event.currentTarget).data("actorId");
    const itemId = $(event.currentTarget).data("itemId");
    const actor = game.actors.get(currentActor);
    const item =  actor.items.get(itemId); //actor.getOwnedItem(itemId);
    const items = item.clone();
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
                        if (quant > item.system.quant){
                            ui.notifications.warn("Você não pode enviar mais itens que você tem!");
                        } else if (quant == items.system.quant) {
                            const tradeData = {
                                itemc: items,
                                currentActor: currentActor,
                                targetActor: user.character.id,
                                quant: quant,
                                type: "trade"
                            };
                            game.socket.emit('module.tagmartrade', tradeData);
                            actor.deleteEmbeddedDocuments("Item", [itemId]);//actor.deleteOwnedItem(itemId);
                        } else {
                            const tradeData = {
                                itemc: items,
                                currentActor: currentActor,
                                targetActor: user.character.id,
                                quant: quant,
                                type: "trade"
                            };
                            game.socket.emit('module.tagmartrade', tradeData);
                            actor.updateEmbeddedDocuments("Item", [{'_id': item.id, 'data.quant': items.system.quant - quant}])
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
                if (user.active && user.character !== null && user !== game.user && !user.isGM) $('.users_names').append("<option value='"+user.id+"'>"+user.name+"</option>");
            }
        },
    });
    dialog.render(true);
}