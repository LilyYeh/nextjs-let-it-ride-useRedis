import { getCookie } from 'cookies-next';
import {countCards, createCards, foldCards, getCards} from "../../lib/redis_cards";
import {goaling, setNextPlayer, updatePlayer} from "../../lib/redis_player";
import {getGame, updateDiamondMoney, updateGameNumber} from "../../lib/redis_game";

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
		if(isOpenDiamondMode && diamondMoney >= (players.length-1)*100){
			const difference = myCards[0].number - myCards[1].number - 1;
			players.forEach((player,index)=>{
				if(!diamondBets[player.autoIncreNum]) return;

				let pay = 0;
				if(diamondBets[player.autoIncreNum].diamondBets == 1 && bets > 0){ //會中
					if(difference == -1){
						if(myCards[0].number > 9 ){
							pay = (13 - myCards[0].number + 1) * 10;
						}else if(myCards[0].number < 5){
							pay = myCards[0].number * 10;
						}else {
							pay = 5 * 10;
						}
					}else if(difference >= 10){
						pay = 10;
					}else{
						pay = (11 - difference) * 10;
					}
				}else if(diamondBets[player.autoIncreNum].diamondBets == 2 && bets < 0){ //不會中
					if(difference == -1){
						if(myCards[0].number > 7 ){
							pay = (myCards[0].number - 3) * 10;
						}else if(myCards[0].number < 7){
							pay = (13 - myCards[0].number - 2) * 10;
						}else {
							pay = 5 * 10;
						}
					}else if(difference <= 2){
						pay = 10;
					}else{
						pay = (difference - 1) * 10;
					}
				}

				diamondMoney -= pay;
				updateDiamondMoney('minus',pay);

				players[index].money += pay;
				updatePlayer({
					cookieId: player.cookieId,
					pay: pay
				});
			});
		}

		res.status(200).json({my3edCards: my3edCards, players: players, diamondMoney: diamondMoney});
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}

