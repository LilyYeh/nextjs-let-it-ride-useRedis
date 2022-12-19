import { getCookie } from 'cookies-next';
import {countCards, createCards, foldCards, getCards} from "../../lib/redis_cards";
import {goaling, setNextPlayer, updatePlayer} from "../../lib/redis_player";
import {updateDiamondMoney, updateGameNumber} from "../../lib/redis_game";
import {diamondPay} from "../diamondPay";

/*
 * return 一張撲克牌
 * a=黑桃, b=愛心, c=菱形, d=梅花
 */
export default async function handler(req, res) {
	try {
		// 牌庫是否有牌？
		var totalCards = await countCards();

		// fail 重新洗牌
		if(totalCards < 1){
			// create cards 建立牌庫(52張)
			await createCards();
		}

		// 拿取手牌
		const cookieId = await getCookie('cookieId', { req, res });
		const card = await getCards(cookieId,1);
		const my3edCards = card[0];

		// 射龍門
		const myCards = JSON.parse(req.body).myCards;
		let bets = JSON.parse(req.body).bets;
		let bigOrSmall = JSON.parse(req.body).bigOrSmall;
		if(myCards[0].number == myCards[1].number){
			if((bigOrSmall == 'big' && my3edCards.number < myCards[0].number) || (bigOrSmall == 'small' && my3edCards.number > myCards[0].number)){
				bets = -1 * bets;
			}else if(my3edCards.number == myCards[0].number){
				bets = -3 * bets;
			}else if(bigOrSmall === ''){ //正常不回發生
				bets = -1 * bets;
			}
		}else if(myCards[0].number <= my3edCards.number || my3edCards.number <= myCards[1].number){
			if(my3edCards.number == myCards[0].number || myCards[1].number == my3edCards.number){
				bets = -2 * bets;
			}else{
				bets = -1 * bets;
			}
		}

		await goaling(cookieId, bets);

		// 棄牌
		await foldCards(cookieId);

		// 檯面上沒錢了(add 局數)？
		const totalMoney = JSON.parse(req.body).totalMoney;
		if(totalMoney - bets <=0) {
			await updateGameNumber();
		}

		let players = await setNextPlayer();

		//diamondMode
		const isOpenDiamondMode = JSON.parse(req.body).isOpenDiamondMode;
		const diamondBets = JSON.parse(req.body).diamondBets;
		let diamondMoney = JSON.parse(req.body).diamondMoney;
		let diamondBaseMoney = JSON.parse(req.body).diamondBaseMoney;
		if(isOpenDiamondMode && diamondMoney >= (players.length-1)*diamondBaseMoney){
			players.forEach((player,index)=>{
				if(!diamondBets[player.autoIncreNum]) return;

				let ttlPay = 0;
				if(diamondBets[player.autoIncreNum].diamondBets == 1 && bets > 0){ //會中
					ttlPay = diamondPay(diamondMoney,players,diamondBets[player.autoIncreNum].diamondBets,myCards);
				}else if(diamondBets[player.autoIncreNum].diamondBets == 2 && bets < 0){ //不會中
					ttlPay = diamondPay(diamondMoney,players,diamondBets[player.autoIncreNum].diamondBets,myCards);
				}
				diamondMoney -= ttlPay;
				updateDiamondMoney('minus',ttlPay);

				players[index].money += ttlPay;
				updatePlayer({
					cookieId: player.cookieId,
					pay: ttlPay
				});
			});
		}

		res.status(200).json({my3edCards: my3edCards, players: players, diamondMoney: diamondMoney});
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}

