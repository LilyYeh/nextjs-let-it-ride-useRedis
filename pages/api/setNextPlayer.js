import {getCookie} from "cookies-next";
import {setNextPlayer, updatePlayer} from "../../lib/redis_player";
import {foldCards} from "../../lib/redis_cards";
import {updateDiamondMoney,getGame} from "../../lib/redis_game";

export default async function handler(req, res) {
	try {
		const cookieId = await getCookie('cookieId', { req, res });
		const diamondMode = JSON.parse(req.body).diamondMode;
		const myMoney = JSON.parse(req.body).myMoney;
		const baseMoney = JSON.parse(req.body).baseMoney;
		const pay = JSON.parse(req.body).payPass;
		let diamondMoney = 0;
		if(diamondMode && myMoney > baseMoney){
			await updatePlayer({cookieId:cookieId,pay:(-1 * pay)});
			await updateDiamondMoney('add',pay);
			const game = await getGame();
			diamondMoney = game.diamondMoney;
		}
		await foldCards(cookieId);
		let players = await setNextPlayer();
		res.status(200).json({players:players, diamondMoney:diamondMoney});
	}catch (error) {
		res.status(500).json({ error:error.message });
	}
}