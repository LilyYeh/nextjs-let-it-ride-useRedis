import {getAllPlayers, updatePlayer} from "../../lib/redis_player";
import {updateDiamondMoney, updateGameNumber} from "../../lib/redis_game";

export default async function handler(req, res) {
	try {
		const baseMoney = JSON.parse(req.body).baseMoney;
		const baseMyMoney = JSON.parse(req.body).baseMyMoney;
		//const totalMoney = JSON.parse(req.body).totalMoney;

		const money = baseMyMoney - baseMoney;
		const players = await getAllPlayers();
		players.forEach((player,index)=> {
			players[index].money = money;
			updatePlayer({
				cookieId: player.cookieId,
				money: money
			});
		});

		//局數歸零
		await updateGameNumber(0);

		//diamondMode
		await updateDiamondMoney('reset',0);

		res.status(200).json(players);
	}catch (error) {
		res.status(500).json({ error:error.message });
	}
}