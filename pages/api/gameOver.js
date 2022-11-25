import { getAllPlayers, setNextPlayer } from "../../lib/redis_player";

export default async function handler(req, res) {
	try {
		const players = await getAllPlayers();
		players.sort((a, b) => {
			if(a.money > b.money){
				return -1;
			}else{
				return 1;
			}
		})

		await setNextPlayer();

		res.status(200).json(players);
	}catch (error) {
		res.status(500).json({ error:error.message });
	}
}