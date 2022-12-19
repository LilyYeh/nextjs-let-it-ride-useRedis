import {getCookie} from "cookies-next";
import {setNextPlayer, updatePlayer} from "../../lib/redis_player";
import {foldCards} from "../../lib/redis_cards";
import {updateDiamondMoney,getGame} from "../../lib/redis_game";

export default async function handler(req, res) {
	try {
		const cookieId = await getCookie('cookieId', { req, res });
		const myCards = JSON.parse(req.body).myCards;
		const diamondMode = JSON.parse(req.body).diamondMode;
		const myMoney = JSON.parse(req.body).myMoney;
		let diamondMoney = 0;
		if(diamondMode && myMoney > 20){
			//有幾張能射門
			const difference = myCards[0].number - myCards[1].number;
			let pay = 0;
			if(difference == 0) {
				if(myCards[0].number > 7){
					pay = (myCards[0].number - 1) * 10;
				}else if(myCards[0].number < 7){
					pay = (13 - myCards[0].number) * 10;
				}else {
					pay = 6 * 10;
				}
			}else{
				pay = difference * 10;
			}
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