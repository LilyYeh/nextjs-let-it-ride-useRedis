import {useContext} from "react";
import BroadcastContext from "../context/ControlContext";

const players_img = ['queen','king','prince2','queen-flower','king2','prince'];

export default function playerRanking({ranking, playerData, loser, winner}) {
	const props = useContext(BroadcastContext);
	const baseMyMoney = props.baseMyMoney;

	let playerName = players_img[playerData.playerId];
	if(loser == playerData.autoIncreNum){
		playerName = players_img[playerData.playerId]+'-lose';
	}
	if(winner == playerData.autoIncreNum){
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
			<td>${baseMyMoney}</td>
			<td>{totalMyMoneyText}</td>
		</tr>
	)
}