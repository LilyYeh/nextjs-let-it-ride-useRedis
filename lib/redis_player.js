import { Client, Entity, Schema, Repository } from 'redis-om';
import { connect } from "./redis";

class Player extends Entity {}
let schema = new Schema(
	Player,
	{
		socketId: { type: 'string' },
		isCurrentPlayer: { type: "number" },
		money: { type: "number" },
	},
	{
		dataStructure: 'JSON',
	}
);

export async function createPlayer(data) {
	const repository = await connect(schema);

	const entity = repository.createEntity(data);
	const id = await repository.save(entity);

	return id;
}

export async function removePlayers(socketId) {
	const repository = await connect(schema);

	const player = await repository.search()
		.where('socketId').eq(socketId)
		.return.firstId();
	await repository.remove(player);

	return;
}

export async function getAllPlayers() {
	const repository = await connect(schema);

	const player = await repository.search().return.all();

	return player;
}

export async function countPlayers() {
	const repository = await connect(schema);

	await repository.createIndex();
	const totalPlayers = await repository.search().return.count();

	return totalPlayers;
}