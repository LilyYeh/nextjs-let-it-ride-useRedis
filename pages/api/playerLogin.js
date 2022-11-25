import { countAllPlayers, countPlayers, createPlayer, getAllPlayers, getOnePlayer, updatePlayer } from "../../lib/redis_player";
import { setCookie, getCookie } from 'cookies-next';


export default async function handler(req, res) {
	try {

		const socketId = JSON.parse(req.body).socketId;

		let totalPlayers = await countPlayers();
		let isCurrentPlayer = 0;
		if(totalPlayers === 0) {
			isCurrentPlayer = 1;
		}

		let cookieId = await getCookie('cookieId', { req, res });

		// check login
		let player;
		if(cookieId){
			player = await getOnePlayer(cookieId);
		}

		if(!cookieId || !player) {
			cookieId = Math.random().toString(36).substring(7);
			await setCookie('cookieId', cookieId, {req, res, maxAge: 60 * 60 * 24});

			const baseMoney = JSON.parse(req.body).baseMoney;
			const baseMyMoney = JSON.parse(req.body).baseMyMoney;
			const money = baseMyMoney-baseMoney;
			const playerId = Math.floor(Math.random() * 5);

			// create redis
			const allPlayers = await countAllPlayers();
			const autoIncreNum = allPlayers + 1;
			await createPlayer({autoIncreNum:autoIncreNum, playerId:playerId, socketId:socketId, cookieId:cookieId, isCurrentPlayer:isCurrentPlayer, money:money, islogin:true});
			const players = await getAllPlayers();
			res.status(200).json(players);
		}else{
			if(player.islogin){
				res.status(200).json({ error:"login fail" });
				return;
			}else{
				// update redis
				await updatePlayer({socketId:socketId, cookieId:cookieId, islogin:true});
				const players = await getAllPlayers();
				res.status(200).json(players);
			}
		}

	}catch (error) {
		res.status(500).json({ error:error.message });
	}
}