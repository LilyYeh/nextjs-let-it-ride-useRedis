import {getAllPlayers, updatePlayer} from "../../lib/redis_player";
import {getGame, updateDiamondMoney, updateGameNumber} from "../../lib/redis_game";

export default async function handler(req, res) {
	try {
		const baseMoney = JSON.parse(req.body).baseMoney;
		const baseMyMoney = JSON.parse(req.body).baseMyMoney;

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
		const game = await getGame();

		res.status(200).json({players:players, game:game});
	}catch (error) {
		res.status(500).json({ error:error.message });
	}
}