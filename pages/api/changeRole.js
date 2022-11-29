import { updatePlayer } from "../../lib/redis_player";
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
			newPlayerId = await Math.floor(Math.random() * 5);
			console.log('in while',playerId,newPlayerId);
		}
		console.log('end while',newPlayerId);
		await updatePlayer({cookieId:cookieId, playerId:newPlayerId});

		res.status(200).json({playerId: newPlayerId});
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}

