import styles from "./index.module.scss";
import TotalMoney from "./components/totalMoney";
import PlayerRanking from "./components/playerRanking";
import {useContext, useEffect, useMemo, useState} from "react";
import BroadcastContext from './context/ControlContext';

export default function gameOver() {
	const props = useContext(BroadcastContext);
	const baseMoney = props.baseMoney;
	const baseMyMoney = props.baseMyMoney;
	const broadcast = props.broadcast;
	const broadcastData = props.broadcastData;
	const setBlock = props.setBlock;

	const [ players, setPlayers ] = useState([]);

	const [ gameNumber, setNumber ] = useState(0);
	const [ ttlNumber, setTtlNumber ] = useState(10);

	const [ isOpenDiamondMode, setOpenDiamondMode] = useState(false);
	const [ diamondMoney, setDiamondMoney ] = useState(0);

	// 計算總金額
	const totalMoney = useMemo(() => calculateTotalMoney(players,diamondMoney) ,[players,diamondMoney]);
	const loser = useMemo(() => setWinnerAndLoser(players) ,[players]).loser;
	const winner = useMemo(() => setWinnerAndLoser(players) ,[players]).winner;

	useEffect(()=>{
		switch (broadcastData.name) {
			case "game-over":
				setPlayers(broadcastData.data.players);
				setNumber(broadcastData.data.game.number);
				setTtlNumber(broadcastData.data.game.ttl);
				setOpenDiamondMode(broadcastData.data.game.diamondMode);
				setDiamondMoney(broadcastData.data.game.diamondMoney);
				break;

			default:
				break;
		}
	},[broadcastData]);

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
		return baseAllMoney - totalPlayersMoney - diamondMoney;
	}

	function setWinnerAndLoser(players){
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
			return {winner:maxMoneyPlayer, loser:minMoneyPlayer};
		}
		return {winner:0, loser:0};
	}

	return (
		<>
			<TotalMoney ttlMoney={totalMoney}
			            gameNumber={gameNumber}
			            ttlNumber={ttlNumber}
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
						                       loser={loser}
						                       winner={winner}
						/>)
					})
				}
				</tbody>
			</table>
			<button className={'btn '+'btn-red-outline '+styles.newGame} onClick={newGame}>重新遊戲</button>
		</>
	)
}