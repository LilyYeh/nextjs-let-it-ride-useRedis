import styles from "./index.module.scss";

const players_img = ['queen','king','prince2','queen-flower','king2','prince'];

export default function playerRanking({ranking, playerData, baseMyMoney, minPrivateMoney, maxPrivateMoney}) {
	let playerName = players_img[playerData.playerId];
	if(minPrivateMoney == playerData.autoIncreNum){
		playerName = players_img[playerData.playerId]+'-lose';
	}
	if(maxPrivateMoney == playerData.autoIncreNum){
		playerName = players_img[playerData.playerId]+'-win';
	}

	let totalMyMoney = playerData.money - baseMyMoney;
	let totalMyMoneyText = '$'+totalMyMoney;
	if(totalMyMoney < 0){
		totalMyMoneyText = '-$'+(totalMyMoney * -1);
	}
	return (
		<tr>
			<td>{ranking}</td>
			<td><img src={`/images/players/${playerName}.svg`} /></td>
			<td>{baseMyMoney}</td>
			<td>{totalMyMoneyText}</td>
		</tr>
	)
}