import {getAllPlayers, updatePlayer} from "../../lib/redis_player";

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

		res.status(200).json(players);
	}catch (error) {
		res.status(500).json({ error:error.message });
	}
}