Hooks.on("renderActorSheet", function (sheet, html, character) {
    if (character.actor.type !== "Personagem") return;
    for (let ht of html.find(".movePertence")) {
        if ($(ht).attr('title') === "Mover para Transporte") {
            $('<a style="margin-left:5px;" class="tradePertence" title="Mandar para amigo" data-actor-id="'+ character.actor._id +'" data-item-id="'+ ht.dataset.itemId +'"><i class="fas fa-handshake"></i></a>').insertAfter(ht);
        }
    }
    html.find(".tradePertence").click(mandaEvento.bind(this));
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
    targetActor.createOwnedItem(item);
}

function mandaEvento(event) {
    const currentActor = $(event.currentTarget).data("actorId");
    const itemId = $(event.currentTarget).data("itemId");
    const actor = game.actors.get(currentActor);
    const item = actor.getOwnedItem(itemId);
    const items = duplicate(item);
    let actorTarget = [];
    let targetActor = new Actor();
    for (let token of game.user.targets) {
        actorTarget.push(token.data.actorId);
        targetActor = token.actor;
    }
    let continua = false;
    for (let user of game.users) {
        if (user.character === targetActor && user.active) {
            continua = true;
        }
    }
    const actorVai = actorTarget[0];
    if (continua) {
        const tradeData = {
            item: items._id,
            currentActor: currentActor,
            userId: game.user._id,
            targetActor: actorVai
        };
        game.socket.emit('module.tagmartrade', tradeData);
        actor.deleteOwnedItem(itemId);
    } else {
        ui.notifications.warn("Jogador não disponível!");
    }
}
