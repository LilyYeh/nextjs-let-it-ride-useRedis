import {getAllPlayers, updatePlayer} from "../../lib/redis_player";
import { getCookie } from 'cookies-next';

/*
 * return 一張撲克牌
 * a=黑桃, b=愛心, c=菱形, d=梅花
 */
export default async function handler(req, res) {
	try {
		const cookieId = await getCookie('cookieId', { req, res });
		const playerId = JSON.parse(req.body).playerId;
		let newPlayerId = playerId;
		while(newPlayerId == playerId) {
			newPlayerId = await Math.floor(Math.random() * 6);
		}
		await updatePlayer({cookieId:cookieId, playerId:newPlayerId});

		const players = await getAllPlayers();

		res.status(200).json({players: players});
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}

