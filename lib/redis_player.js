import { Client, Entity, Schema, Repository } from 'redis-om';
import { connect } from "./redis";
import { foldCards } from "./redis_cards";

class Player extends Entity {}
let schema = new Schema(
	Player,
	{
		autoIncreNum: { type: "number" },
		playerId: { type: "number" },
		socketId: { type: 'string' },
		cookieId: { type: 'string' },
		isCurrentPlayer: { type: "number" },
		money: { type: "number" },
		islogin: { type: "boolean" },
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
		.return.first();
	if(player){
		if(player.isCurrentPlayer){
			console.log('player is currentPlayer');
			await setNextPlayer();
		}
		await foldCards(player.cookieId);
		await updatePlayer({
			entityId: player.entityId,
			islogin: false
		});
	}
	const players = await getAllPlayers();

	return players;
}

export async function getAllPlayers() {
	const repository = await connect(schema);

	await repository.createIndex();
	let player = await repository.search()
		.where('islogin').true()
		.return.all();

	player = await sort(player);
	function sort(data) {
		data.sort((a, b) => {
			if(a.autoIncreNum > b.autoIncreNum){
				return 1;
			}else{
				return -1;
			}
		})
		return data;
	}
	return player;
}

export async function getOnePlayer(cookieId) {
	const repository = await connect(schema);

	await repository.createIndex();
	const player = await repository.search()
		.where('cookieId').eq(cookieId)
		.return.first();
	return player;
}

export async function countPlayers() {
	const repository = await connect(schema);

	//await repository.createIndex();
	const totalPlayers = await repository.search()
		.where('islogin').true()
		.return.count();

	return totalPlayers;
}

export async function countAllPlayers() {
	const repository = await connect(schema);

	await repository.createIndex();
	const allPlayers = await repository.search().return.count();

	return allPlayers;
}

export async function updatePlayer(data) {
	const repository = await connect(schema);

	let playerId;
	if(data.hasOwnProperty('entityId')){
		playerId = data.entityId;
	}else{
		playerId = await repository.search()
			.where('cookieId').eq(data.cookieId)
			.return.firstId();
	}
	const playerData = await repository.fetch(playerId);
	if(data.hasOwnProperty('playerId')) playerData.playerId = data.playerId;
	if(data.hasOwnProperty('socketId')) playerData.socketId = data.socketId;
	if(data.hasOwnProperty('isCurrentPlayer')) {
		playerData.isCurrentPlayer = data.isCurrentPlayer;
	}
	if(data.hasOwnProperty('money')) playerData.money = data.money;
	if(data.hasOwnProperty('bets')) playerData.money = playerData.money + data.bets;
	if(data.hasOwnProperty('baseMoney')) playerData.money = playerData.money - data.baseMoney;
	if(data.hasOwnProperty('islogin')) playerData.islogin = data.islogin;
	await repository.save(playerData);

	return;
}

export async function goaling(cookieId, bets){
	await updatePlayer({
		cookieId: cookieId,
		bets: bets
	});
	return;
}

// set next player
export async function setNextPlayer() {
	let players = await getAllPlayers();
	const totalPlayers = players.length;
	if(totalPlayers<=0){
		return;
	}

	let currentPlayerId;
	for(let index=0; index < totalPlayers; index++){
		if(players[index].isCurrentPlayer){
			players[index].isCurrentPlayer = 0;
			console.log('update currentPlayer to 0', players[index].cookieId, players[index].isCurrentPlayer);
			updatePlayer({
				cookieId: players[index].cookieId,
				isCurrentPlayer: 0
			})

			if(index+1 < totalPlayers){
				players[index + 1].isCurrentPlayer = 1;
				console.log('update currentPlayer to 1', players[index + 1].cookieId, players[index + 1].isCurrentPlayer)
				currentPlayerId = players[index + 1].cookieId;
			}else{
				players[0].isCurrentPlayer = 1;
				console.log('update currentPlayer to 1', players[0].cookieId, players[0].isCurrentPlayer)
				currentPlayerId = players[0].cookieId;
			}
			updatePlayer({
				cookieId: currentPlayerId,
				isCurrentPlayer: 1
			});

			break;
		}
	}

	console.log('end foreach', players[0].cookieId, players[0].isCurrentPlayer);
	return players;
}