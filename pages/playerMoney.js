import { useEffect, useState, useRef } from 'react';
import useRate from "./useRate";
import styles from "./index.module.scss";

const players_img = ['queen','king','prince2','queen-flower','king2','prince'];

export default function playerMoney({playerData, currentPlayer, baseMyMoney, getCardFlag, updateRole}) {
	const [ money, setMoney ]=useState(playerData.money);
	const [ style, setStyle ]=useState(styles[players_img[playerData.playerId]]);
	const [ playerId, setPlayerId ]=useState(playerData.playerId);

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
		setStyle(styles[players_img[playerId]]);
	},[playerId]);

	async function changeRole(e) {
		if (e.currentTarget.classList.contains(styles['isMe'])) {
			const apiUrlEndpoint = `/api/changeRole`;
			const getData = {
				method: "POST",
				header: { "Content-Type": "application/json" },
				body: JSON.stringify({
					playerId: playerId
				})
			}
			const response = await fetch(apiUrlEndpoint, getData);
			const res = await response.json();
			setPlayerId(res.playerId);
			updateRole(playerData.autoIncreNum,res.playerId);
		}
	}

	return (
		<>
			<td className={style + ' ' + (currentPlayer==playerData.autoIncreNum? styles.me : '') + ' ' + styles[playerData.name]} onClick={changeRole}>
				<div className={styles.icon}><img src={"/images/otherMoney.png"}/> <img src={"/images/privateMoney.png"} className={styles.privateMoney}/></div>
				<span className={styles.myMoney}>{useRate(playerData.money, baseMyMoney)}</span>
			</td>
		</>
	)
}