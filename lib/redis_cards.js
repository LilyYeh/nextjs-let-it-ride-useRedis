import { Client, Entity, Schema, Repository } from 'redis-om';
import { connect } from "./redis";

class Cards extends Entity {}
let schema = new Schema(
	Cards,
	{
		number: { type: "number" },
		type: { type: 'string' },
		imgName: { type: 'string' },
		cookieId: { type: "string" }
	},
	{
		dataStructure: 'JSON',
	}
);

export async function createCards() {
	let allCards = [];
	for (let i = 1; i <= 13; i++) {
		['a', 'b', 'c', 'd'].forEach(j => {
			allCards.push({'number': i, 'type': j, 'imgName': i + j, 'cookieId':'0'});
		})
	}
	for (let i = allCards.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = allCards[i];
		allCards[i] = allCards[j];
		allCards[j] = temp;

		//insert redis
		await setCards(allCards[i]);
	}

	return allCards;
}

async function setCards(card) {
	const repository = await connect(schema);

	const entity = repository.createEntity(card);
	const id = await repository.save(entity);

	return id;
}

export async function countCards() {
	const repository = await connect(schema);

	await repository.createIndex();
	const totalCards = await repository.search()
		.where('cookieId').eq('0')
		.return.count();

	return totalCards;
}

export async function getCards(cookieId,limit) {
	const repository = await connect(schema);

	const cards = await repository.search()
		.where('cookieId').eq('0')
		.return.page(0,limit);

	cards.forEach((card) => {
		updateCookieId(card)
	})

	return cards;

	async function updateCookieId(card) {
		const cardData = await repository.fetch(card.entityId);
		cardData.cookieId = cookieId;
		await repository.save(cardData);
	}
}

export async function foldCards(cookieId) {
	const repository = await connect(schema);

	await repository.createIndex();
	const cards = await repository.search()
		.where('cookieId').eq(cookieId)
		.return.all();
	for(let i=0; i<cards.length; i++){
		await repository.remove(cards[i].entityId);
	}

	return;
}