import { setNextPlayer } from "../../lib/redis_player";
import {getCookie} from "cookies-next";
import {foldCards} from "../../lib/redis_cards";

export default async function handler(req, res) {
	try {
		const cookieId = await getCookie('cookieId', { req, res });
		await foldCards(cookieId);
		let players = await setNextPlayer();
		res.status(200).json(players);
	}catch (error) {
		res.status(500).json({ error:error.message });
	}
}