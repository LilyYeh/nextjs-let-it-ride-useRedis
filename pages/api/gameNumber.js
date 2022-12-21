import { getGame, updateTtlGameNum } from "../../lib/redis_game";

export default async function handler(req, res) {
	try {
		if(req.method == 'POST'){
			const num = JSON.parse(req.body).ttlGameNumber;
			await updateTtlGameNum(num);
		}

		const game = await getGame();
		res.status(200).json({ game:game });
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}