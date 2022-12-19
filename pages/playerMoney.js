import { useEffect, useState, useRef } from 'react';
import useRate from "./useRate";
import styles from "./index.module.scss";

const players_img = ['queen','king','prince2','queen-flower','king2','prince'];

export default function playerMoney({socketId, playerData, currentPlayer, baseMyMoney, getCardFlag, updateRole, broadcast, playersClickDiamondBets}) {
	const [ money, setMoney ]=useState(playerData.money);
	const [ style, setStyle ]=useState(styles[players_img[playerData.playerId]]);

	const diamondBetsValue = {1:'會射中',2:'不會射中'};
	const [ diamondBetsTag, setDiamondBetsTag] = useState(0);

	useEffect(() => {
		if(getCardFlag){
			if (playerData.money > money) {
				setStyle(styles[players_img[playerData.playerId] + '-win']);
			} else if (playerData.money < money) {
				setStyle(styles[players_img[playerData.playerId] + '-lose']);
			} else {
				setStyle(styles[players_img[playerData.playerId]]);
			}
		}else{
			setStyle(styles[players_img[playerData.playerId]]);
		}

		setMoney(playerData.money);
	},[getCardFlag,playerData.money,playerData.playerId]);

	useEffect(() => {
		setDiamondBetsTag(0)
		if(playersClickDiamondBets.hasOwnProperty(playerData.autoIncreNum)){
			setDiamondBetsTag(playersClickDiamondBets[playerData.autoIncreNum].diamondBets);
		}
	},[playersClickDiamondBets]);

	async function changeRole(e) {
		if (e.currentTarget.classList.contains(styles['isMe'])) {
			let newPlayerId = playerData.playerId;
			while(newPlayerId == playerData.playerId) {
				newPlayerId = await Math.floor(Math.random() * 6);
			}
			updateRole(playerData.autoIncreNum,newPlayerId);
			broadcast('update-role',{autoIncreNum:playerData.autoIncreNum, newPlayerId:newPlayerId});

			const apiUrlEndpoint = `/api/changeRole`;
			const getData = {
				method: "POST",
				header: { "Content-Type": "application/json" },
				body: JSON.stringify({
					newPlayerId: newPlayerId
				})
			}
			const response = await fetch(apiUrlEndpoint, getData);
			const res = await response.json();
		}
	}

	return (
		<>
			<li className={`${style} ${currentPlayer.autoIncreNum==playerData.autoIncreNum? styles.me : ''} ${socketId==playerData.socketId? styles.isMe : ''}`} onClick={changeRole}>
				<div className={styles.icon}>
					<img src={"/images/privateMoney.png"} className={styles.privateMoney}/>
					<label className={`${styles.playerDiamondBets} ${diamondBetsTag? (diamondBetsTag==1? styles.goal : styles.fail) : ''}`}>{diamondBetsTag? diamondBetsValue[diamondBetsTag]:''}</label>
				</div>
				<span className={styles.myMoney}>{useRate(playerData.money, baseMyMoney)}</span>
			</li>
		</>
	)
}