import { Client, Entity, Schema, Repository } from 'redis-om';
import { connect } from "./redis";

class Game extends Entity {}
let schema = new Schema(
	Game,
	{
		number: { type: "number" },
		ttl: { type: "number" },
	},
	{
		dataStructure: 'JSON',
	}
);

export async function countGame() {
	const repository = await connect(schema);
	await repository.createIndex();
	const isCreateGame = await repository.search().return.count();
	return isCreateGame;
}

export async function createGame() {
	const repository = await connect(schema);
	const entity = repository.createEntity({number:0,ttl:10});
	const gameId = await repository.save(entity);
	return gameId;
}


export async function updateGameNumber(num) {
	const repository = await connect(schema);

	const gameId = await repository.search().return.firstId();
	const game = await repository.fetch(gameId);
	if(num == 0){
		game.number = 0;
	}else{
		game.number = game.number + 1;
	}
	await repository.save(game);

	return;
}

export async function getGame() {
	const repository = await connect(schema);

	const game = await repository.search().return.first();

	return game;
}