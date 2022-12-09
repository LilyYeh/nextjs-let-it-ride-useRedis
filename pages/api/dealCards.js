import {countCards, createCards, getCards} from "../../lib/redis_cards";
import {updatePlayer} from "../../lib/redis_player";
import { getCookie } from 'cookies-next';

/*
 * return 一副撲克牌
 * a=黑桃, b=愛心, c=菱形, d=梅花
 */
export default async function handler(req, res) {
	try {
		const cookieId = await getCookie('cookieId', { req, res });

		// 牌庫是否有牌？
		const totalCards = await countCards();

		// fail 重新洗牌
		if(totalCards < 2){
			// create cards 建立牌庫(52張)
			await createCards();
		}

		// ok 拿取手牌
		const cards = await getCards(cookieId,2);

		const baseMoney = JSON.parse(req.body).baseMoney;
		const baseMyMoney = JSON.parse(req.body).baseMyMoney;
		let players = JSON.parse(req.body).players;

		// 計算檯面金額
		let baseAllMoney = players.length * baseMyMoney;
		let totalPlayersMoney = 0;
		players.forEach((player,index)=>{
			totalPlayersMoney += player.money;
		});
		// 檯面沒錢了
		if(baseAllMoney - totalPlayersMoney <= 0){
			players.forEach((player,index)=> {
				players[index].money = player.money - baseMoney;
				updatePlayer({
					cookieId: player.cookieId,
					baseMoney: baseMoney
				});
			});
		}

		//api 一定要放 res.status(200).json(myCards); 才能印出資料
		res.status(200).json({ cards:sort(cards), players:players });
	} catch (error) {
		res.status(500).json({ error:error.message });
	}
}

function rand(number,total) {
	var arr = [];
	if(total < 1) return arr;
	while(arr.length < number){
		var r = Math.floor(Math.random() * total);
		if(arr.indexOf(r) === -1) arr.push(r);
	}
	return arr;
}

function sort(data) {
	data.sort((a, b) => {
		if(a.number > b.number){
			return -1;
		}else if(a.number === b.number){
			if(a.type >= b.type){
				return 1;
			}else {
				return -1;
			}
		}else{
			return 1;
		}
	})
	return data;
}


/*  產生 52 張撲克牌
	let allCards = [];
	for(let i=1; i<=13; i++){
		['a','b','c','d'].forEach(j=>{
			allCards.push({'number':i, 'type':j, 'imgName':i+j+'.jpg'});
		})
	}
*/
