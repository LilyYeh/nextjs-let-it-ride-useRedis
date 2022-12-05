import { countGame, createGame, getGame } from "../../lib/redis_game";

export default async function handler(req, res) {
	try {
		if(req.method == 'GET'){
			const isCreateGame = await countGame();
			if(!isCreateGame){
				await createGame();
			}
		}

		const game = await getGame();
		res.status(200).json({ game:game });
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}