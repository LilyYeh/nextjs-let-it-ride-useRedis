import styles from "./index.module.scss";
import TotalMoney from "./totalMoney";
import PlayerRanking from "./playerRanking";
import {useEffect, useState} from "react";

export default function gameOver({baseMoney,baseMyMoney,broadcast,setBlock}) {
	const [ players, setPlayers ] = useState([]);
	const [ totalMoney, setTotalMoney ] = useState(0);
	const [ minPrivateMoney, setMinPrivateMoney ] = useState(0);
	const [ maxPrivateMoney, setMaxPrivateMoney ] = useState(0);

	const [gameNumber, setNumber] = useState('0/10');

	useEffect(()=>{
		gameOver();
		getGameNumber();
	},[]);

	useEffect(()=>{
		let baseAllMoney = players.length * baseMyMoney;
		let totalPlayersMoney = 0;
		let minMoney = 9999;
		let maxMoney = 0;
		let minMoneyPlayer = 0;
		let maxMoneyPlayer = 0;
		players.forEach((player,index)=>{
			//剩餘錢最少的玩家
			if(player.money < minMoney){
				minMoney = player.money;
				minMoneyPlayer = player.autoIncreNum;
			}
			//剩餘錢最多的玩家
			if(player.money > maxMoney){
				maxMoney = player.money;
				maxMoneyPlayer = player.autoIncreNum;
			}
			totalPlayersMoney += player.money;
		});
		if(maxMoney > minMoney) {
			setMinPrivateMoney(minMoneyPlayer);
			setMaxPrivateMoney(maxMoneyPlayer);
		}else{
			setMinPrivateMoney(0);
			setMaxPrivateMoney(0);
		}
		setTotalMoney(baseAllMoney - totalPlayersMoney);

	},[players]);

	async function gameOver() {
		const apiUrlEndpoint = `/api/gameOver`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				totalMoney: totalMoney
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		setPlayers(res);
	}

	async function newGame() {
		const res = await getNewGameData();
		broadcast('new-game',res);
		setBlock("Game",res);
	}

	async function getNewGameData() {
		const apiUrlEndpoint = `/api/newGame`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				baseMoney: baseMoney,
				baseMyMoney: baseMyMoney
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		return res;
	}

	async function getGameNumber() {
		const apiUrlEndpoint = `/api/gameNumber`;
		const getData = {
			method: "GET",
			header: { "Content-Type": "application/json" }
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		setNumber(res.game.number+'/'+res.game.ttl);
		return res;
	}

	return (
		<>
			<TotalMoney ttlMoney={totalMoney} gameNumber={gameNumber}/>
			<table className={styles.gameOver}>
				<thead>
				<tr>
					<th>排名</th>
					<th>玩家</th>
					<th>$$</th>
					<th>勝負</th>
				</tr>
				</thead>
				<tbody>
				{
					players.map((rank, index) => {
						return (<PlayerRanking key={index}
						                       ranking={index+1}
						                       playerData={rank}
						                       baseMyMoney={baseMyMoney}
						                       minPrivateMoney={minPrivateMoney}
						                       maxPrivateMoney={maxPrivateMoney}
						/>)
					})
				}
				</tbody>
			</table>
			<button className={'btn '+'btn-red-outline '+styles.newGame} onClick={newGame}>重新遊戲</button>
		</>
	)
}