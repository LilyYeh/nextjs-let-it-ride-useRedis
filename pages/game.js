import styles from "./index.module.scss";
import pocker from "./pocker.module.scss";
import PlayerMoney from "./playerMoney";
import TotalMoney from "./totalMoney";
import {useEffect, useState} from "react";

export default function game({socketId,baseMoney,baseMyMoney,broadcast,broadcastData,setBlock}) {
	const [ myId, setMyId ] = useState(0);
	const [ players, setPlayers ] = useState([]);
	const [ currentPlayer, setCurrentPlayer ] = useState(0);
	const [ isMyTurn, setMyTurn ] = useState(false);

	//myCards[0]、myCards[1] 龍柱
	const defaultMyCards = [{"number":0,"type":"","imgName":"back"},{"number":0,"type":"","imgName":"back"}]
	const [ myCards, setMyCard ] = useState(defaultMyCards);
	const [ my3edCards, set3edCard ] = useState({});

	const betsButtons = [10,30,50];
	const [ inputBets, setInputBets ] = useState(0);
	const [ buttonBets, setButtonBets ] = useState(0);
	const [ bets, setBets ] = useState(0);
	const [ bigOrSmall, setBigOrSmall ] = useState('');

	const [ myMoney, setMyMoney ] = useState(baseMyMoney);
	const [ totalMoney, setTotalMoney ] = useState(0);
	const [ isAnyPlayerCanPlay, setIsAnyPlayerCanPlay ] = useState(false);
	const [ isAnyPlayerCantPlay, setIsAnyPlayerCantPlay ] = useState(false);

	const [ getCardFlag, setClickedGetCard ] = useState(false);
	const [ isNavOpen, setNavOpen ] = useState(false);

	const [gameNumber, setNumber] = useState('0/10');

	async function dealCards(e) {
		// 人物表情 Default
		setClickedGetCard(false);
		broadcast('clicked-getCard',false);

		e.target.disabled = true;
		const apiUrlEndpoint = `/api/dealCards`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				baseMyMoney: baseMyMoney,
				baseMoney: baseMoney,
				players: players
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		setMyCard(res.data.cards);
		set3edCard({});
		setPlayers(res.data.players);
		broadcast('update-players',res.data.players);
	}

	async function getCard(e)   {
		// 人物表情變換
		setClickedGetCard(true);
		broadcast('clicked-getCard',true);

		e.target.disabled = true;
		const apiUrlEndpoint = `/api/getCard`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				myCards: myCards,
				bets: bets,
				bigOrSmall: bigOrSmall,
				totalMoney: totalMoney
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		set3edCard(res.my3edCards);
		setPlayers(res.players);
		broadcast('set-next-player',res.players);
	}

	async function nextPlayer(e) {
		e.target.disabled = true;
		const apiUrlEndpoint = `/api/setNextPlayer`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" }
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		broadcast('set-next-player',res);
		setDefault(res);
	}

	async function onChangeInputBets(value) {
		let input = 0;
		if(value=='+'){
			if(buttonBets){
				input = inputBets + buttonBets;
			}else{
				input = bets+10;
			}
		}else if(value=='-'){
			if(buttonBets){
				//input = inputBets - buttonBets;
				input = inputBets - 10;
			}else{
				input = bets-10;
			}
		}
		const myBets = await checkBets(input);
		setInputBets(myBets);
		setBets(myBets);
	}

	async function onChangeButtonBets(value) {
		const myBets = await checkBets(value);
		if(myBets == value) {
			setButtonBets(value);
			setInputBets(value);
			setBets(value);
		}
	}

	function checkBets(value) {
		let maxBets = Math.floor(myMoney / 2);
		if(myCards[0].number == myCards[1].number){
			maxBets = Math.floor(myMoney / 3);
		}
		if(value > totalMoney) {
			//alert('最多可下注 $'+totalMoney);
			return totalMoney;

		}else if(value > maxBets) {
			let mB = Math.floor(maxBets/10) * 10;
			//alert('沒錢了(ಥ﹏ಥ) 最多可下注 $'+mB);
			return mB;
		}else if(value <= 0) {
			return 0;
		}
		return value;
	}

	async function newGame() {
		const res = await getNewGameData();
		setDefault(res)
		getGameNumber();
		broadcast('new-game',res);
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

	function gemeOver() {
		broadcast('game-over',[]);
		setBlock("GameOver");
	}

	function setDefault(playersData) {
		setPlayers(playersData);
		setMyCard(defaultMyCards);
		set3edCard({});
		setBets(0);
		setInputBets(0);
		setButtonBets(0);
		setNavOpen(false);
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

	function updateRole(autoIncreNum,newPlayerId) {
		players.forEach((player,index)=>{
			if(player.autoIncreNum == autoIncreNum){
				players[index].playerId = newPlayerId;
			}
		});
		broadcast('update-players',players);
	}

	useEffect(()=>{
		switch (broadcastData.name) {
			case "update-players":
				setPlayers(broadcastData.data);
				break;

			case "set-next-player":
				setDefault(broadcastData.data);
				break;

			case "new-game":
				// 人物表情 Default
				setClickedGetCard(false);
				setDefault(broadcastData.data);
				getGameNumber();
				break;

			case "clicked-getCard":
				setClickedGetCard(broadcastData.data);
				break;

			default:
				break;

		}
	},[broadcastData]);

	useEffect(()=>{
		let baseAllMoney = players.length * baseMyMoney;
		let totalPlayersMoney = 0;
		let canPlay = false;
		let someoneCantPlay = false;
		players.forEach((player,index)=>{
			if(player.money >= 20){
				//還有人有錢
				canPlay = true;
			}
			if(player.money < 30){
				//有人沒錢了
				someoneCantPlay = true;
			}
			totalPlayersMoney += player.money;
			if(player.socketId == socketId){
				setMyId(player.autoIncreNum);
				setMyMoney(player.money);
			}
			if(player.isCurrentPlayer){
				setCurrentPlayer(player.autoIncreNum)
			}
		});
		setTotalMoney(baseAllMoney - totalPlayersMoney);
		setIsAnyPlayerCanPlay(canPlay);
		setIsAnyPlayerCantPlay(someoneCantPlay);
	},[players]);

	useEffect(()=>{
		if(currentPlayer == myId){
			setMyTurn(true);
		}else{
			setMyTurn(false);
		}
	},[currentPlayer,myId]);

	useEffect(()=>{
		//若兩張牌一樣，選擇比大比小
		if(myCards[0].number>0 && myCards[0].number == myCards[1].number){
			if(myCards[0].number >= 7){
				setBigOrSmall('small');
			}else{
				setBigOrSmall('big');
			}
		}else{
			setBigOrSmall('');
		}
	},[myCards]);

	useEffect(()=>{
		if(totalMoney <= 0){
			getGameNumber();
		}
	},[totalMoney]);

	let the3edCardDev = <>
		<button className={'btn '+'btn-red-outline '+styles.shoot} onClick={getCard} disabled={!isMyTurn || !myCards[0].number || bets<=0 || totalMoney <=0}>射</button>
		<button className={'btn '+'btn-black-outline '+styles.pass} onClick={nextPlayer} disabled={!isMyTurn || !myCards[0].number || totalMoney <=0}>pass</button>
	</>;
	if(my3edCards.imgName) {
		the3edCardDev = '';
	}

	let theDealCardDev = <>
		<button className={'btn '+'btn-red-outline '+styles.deal} onClick={dealCards} disabled={!isMyTurn || myCards[0].number}>重新發牌</button>
	</>
	if(!isAnyPlayerCanPlay || (totalMoney <=0 && isAnyPlayerCantPlay) || gameNumber==10){
		theDealCardDev = <button className={'btn '+'btn-black-outline '+styles.endGame} onClick={gemeOver}>遊戲結束</button>;
	}else if(myMoney<20 && isMyTurn){
		theDealCardDev = <button className={'btn '+'btn-black-outline '+styles.pass} onClick={nextPlayer} disabled={false}>pass</button>;
	}

	return (
		<>
			<TotalMoney ttlMoney={totalMoney} gameNumber={gameNumber}/>
			<div className={styles.myGameBoard}>
				<div className={styles.gameBoard}>
					<div className={`${styles.card1} ${pocker['bg-'+myCards[0].imgName]}`}></div>
					<div className={`${styles.card3} ${my3edCards.imgName ? pocker['bg-'+my3edCards.imgName] : ''}`}>{the3edCardDev}</div>
					<div className={`${styles.card1} ${pocker['bg-'+myCards[1].imgName]}`}></div>
				</div>
				<div className={styles.bets+(myCards[0].number? " "+styles.active : "")}>
					<label className={styles.title}>下注</label>
					<div className={styles.bigOrSmallArea+(myCards[0].number==myCards[1].number? " "+styles.active : "")}>
						<span className={styles.inputRadio} onClick={(e) => setBigOrSmall('big')}>
								<input type="radio" name="bigOrSmall" value="big" onChange={(e) => setBigOrSmall('big')} checked={bigOrSmall=='big'} />比大
							</span>
						<span className={styles.inputRadio} onClick={(e) => setBigOrSmall('small')}>
								<input type="radio" name="bigOrSmall" value="small" onChange={(e) => setBigOrSmall('small')} checked={bigOrSmall=='small'} />比小
							</span>
					</div>
					{
						betsButtons.map((num) => {
							return(
								<div key={num} className={`${styles.coin} ${inputBets==num? styles.active : ""} ${checkBets(num)==num? "" : styles.disabled}`} onClick={() => onChangeButtonBets(num)}>${num}</div>
							)
						})
					}
					<div className={`${styles.inputCoin} ${bets && bets==inputBets? styles.active : ""}`}>
						<button className={styles.minus} onClick={() => onChangeInputBets('-')}>–</button>
						<input type="text" value={`$${inputBets}`} onChange={onChangeInputBets}/>
						<button className={styles.plus} onClick={() => onChangeInputBets('+')}>+</button>
					</div>
				</div>
				<div className={styles.dealCards}>
					{theDealCardDev}
				</div>
			</div>
			<div id={styles.menu}>
				<ul className={styles.nav + ' ' + (isNavOpen? styles.active:'')}>
					<li><button className={'btn '+'btn-black-outline '+styles.endGame} onClick={gemeOver}>遊戲結束</button></li>
					<li><button className={'btn '+'btn-red-outline '+styles.newGame} onClick={newGame}>重新遊戲</button></li>
				</ul>
				<div className={styles.openNav} onClick={()=>setNavOpen(isNavOpen? false:true)}></div>
				<div className={styles.privateMoneyWrapper}>
					<ul className={styles.privateMoney}>
						{
							players.map((plmny, index) => {
								return (<PlayerMoney key={index}
								                     socketId={socketId}
								                     playerData={plmny}
								                     currentPlayer={currentPlayer}
								                     baseMyMoney={baseMyMoney}
								                     getCardFlag={getCardFlag}
								                     updateRole={updateRole}
								/>)
							})
						}
					</ul>
				</div>
			</div>
		</>
	)
}