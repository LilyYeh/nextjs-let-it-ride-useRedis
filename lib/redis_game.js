import { Client, Entity, Schema, Repository } from 'redis-om';
import { connect } from "./redis";

class Game extends Entity {}
let schema = new Schema(
	Game,
	{
		number: { type: "number" },
		ttl: { type: "number" },
		diamondMode: { type: "boolean" },
		diamondMoney: { type: "number" }
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
	const entity = repository.createEntity({number:0,ttl:10,diamondMode:false,diamondMoney:0});
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

export async function updateTtlGameNum(num) {
	const repository = await connect(schema);

	const gameId = await repository.search().return.firstId();
	const game = await repository.fetch(gameId);
	game.ttl = num;
	await repository.save(game);
	return;
}

export async function getGame() {
	const repository = await connect(schema);

	const game = await repository.search().return.first();

	return game;
}

export async function updateDiamondMode(value) {
	const repository = await connect(schema);

	const gameId = await repository.search().return.firstId();
	const game = await repository.fetch(gameId);
	game.diamondMode = value;
	await repository.save(game);

	return;
}

export async function updateDiamondMoney(type,value) {
	const repository = await connect(schema);

	const gameId = await repository.search().return.firstId();
	const game = await repository.fetch(gameId);
	if(type=='add'){
		game.diamondMoney = game.diamondMoney + value;
	}else if(type=='minus'){
		game.diamondMoney = game.diamondMoney - value;
	}else if(type=='reset'){
		game.diamondMoney = 0;
	}

	await repository.save(game);

	return;
}