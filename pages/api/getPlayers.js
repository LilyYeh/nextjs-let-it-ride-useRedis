import { getAllPlayers } from "../../lib/redis_player";

export default async function handler(req, res) {
	try {
		const players = await getAllPlayers();

		res.status(200).json(players);
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}

