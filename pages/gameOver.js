import styles from "./index.module.scss";
import TotalMoney from "./totalMoney";
import PlayerRanking from "./playerRanking";
import {useEffect, useState} from "react";

export default function gameOver({baseMoney,baseMyMoney,broadcast,broadcastData,setBlock}) {
	const [ players, setPlayers ] = useState([]);
	const [ totalMoney, setTotalMoney ] = useState(0);
	const [ minPrivateMoney, setMinPrivateMoney ] = useState(0);
	const [ maxPrivateMoney, setMaxPrivateMoney ] = useState(0);

	const [ gameNumber, setNumber ] = useState(0);
	const [ ttlNumber, setTtlNumber ] = useState(10);

	const [ isOpenDiamondMode, setOpenDiamondMode] = useState(false);
	const [ diamondMoney, setDiamondMoney ] = useState(0);

	useEffect(()=>{
		switch (broadcastData.name) {
			case "game-over":
				setPlayers(broadcastData.data.players);
				setNumber(broadcastData.data.game.number);
				setTtlNumber(broadcastData.data.game.ttl);
				setOpenDiamondMode(broadcastData.data.game.diamondMode);
				calculateTotalMoney(broadcastData.data.players,broadcastData.data.game.diamondMoney);
				break;

			default:
				break;
		}
	},[broadcastData]);

	useEffect(()=>{
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
		});
		if(maxMoney > minMoney) {
			setMinPrivateMoney(minMoneyPlayer);
			setMaxPrivateMoney(maxMoneyPlayer);
		}else{
			setMinPrivateMoney(0);
			setMaxPrivateMoney(0);
		}

	},[players]);

	// 重新遊戲
	async function newGame() {
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
		broadcast('new-game',res);
		setBlock("Game",res);
	}

	async function clickOpenDiamondMode(value) {
		setOpenDiamondMode(value);
		broadcast('click-open-diamondMode',value);

		const apiUrlEndpoint = `/api/openDiamondMode`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				value: value
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
	}

	function calculateTotalMoney(players,diamondMoney){
		let baseAllMoney = players.length * baseMyMoney;
		let totalPlayersMoney = 0;
		players.forEach((player)=>{
			totalPlayersMoney += player.money;
		});
		setTotalMoney(baseAllMoney - totalPlayersMoney - diamondMoney);
		setDiamondMoney(diamondMoney);
	}

	return (
		<>
			<TotalMoney ttlMoney={totalMoney}
			            gameNumber={gameNumber}
			            ttlNumber={ttlNumber}
			            broadcast={broadcast}
			            clickOpenDiamondMode={clickOpenDiamondMode}
			            isOpenDiamondMode={isOpenDiamondMode}
			            diamondMoney={diamondMoney}/>
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