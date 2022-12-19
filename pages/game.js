import styles from "./index.module.scss";
import pocker from "./pocker.module.scss";
import PlayerMoney from "./playerMoney";
import TotalMoney from "./totalMoney";
import {useEffect, useState} from "react";
import {updateDiamondMoney} from "../lib/redis_game";

export default function game({socketId,baseMoney,baseMyMoney,broadcast,broadcastData,setBlock}) {
	const [ myId, setMyId ] = useState(0);
	const [ players, setPlayers ] = useState([]);
	const [ currentPlayer, setCurrentPlayer ] = useState({});
	const [ isMyTurn, setMyTurn ] = useState(false);

	//myCards[0]、myCards[1] 龍柱
	const defaultMyCards = [{"number":0,"type":"","imgName":"back"},{"number":0,"type":"","imgName":"back"}]
	const [ myCards, setMyCard ] = useState(defaultMyCards);
	const [ my3edCards, set3edCard ] = useState({});
	const [ pay, setPay ] = useState(0);

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

	const [ gameNumber, setNumber ] = useState(0);
	const [ ttlNumber, setTtlNumber ] = useState(10);

	const [ isOpenDiamondMode, setOpenDiamondMode] = useState(false);
	const [ diamondMoney, setDiamondMoney ] = useState(0);
	const [ isDiamondOverlay, setDiamondOverlay ] = useState(false);
	const [ playerCards, setPlayerCards ] = useState(defaultMyCards);
	const [ player3edCard, setPlayer3edCard ] = useState({});
	const [ diamondBets, setDiamondBets ] = useState(false);
	const [ playersClickDiamondBets, setPlayersClickDiamondBets ] = useState({});
	const [ shoot, setShoot ] = useState(true);

	async function dealCards(e) {
		// 人物表情 Default
		setClickedGetCard(false);

		e.target.disabled = true;
		const apiUrlEndpoint = `/api/dealCards`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				//baseMyMoney: baseMyMoney,
				baseMoney: baseMoney,
				players: players,
				totalMoney: totalMoney
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		setMyCard(res.cards);
		set3edCard({});
		setPlayers(res.players);
		calculateTotalMoney(res.players,diamondMoney);
		broadcast('deal-cards',{players:res.players, cards:res.cards});
		setDiamondModeDefault();
	}

	async function getCard(e)   {
		// 人物表情變換
		setClickedGetCard(true);

		e.target.disabled = true;
		const apiUrlEndpoint = `/api/getCard`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				myCards: myCards,
				bets: bets,
				bigOrSmall: bigOrSmall,
				totalMoney: totalMoney,
				isOpenDiamondMode:isOpenDiamondMode,
				diamondMoney:diamondMoney,
				diamondBets:playersClickDiamondBets,
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		set3edCard(res.my3edCards);
		setPlayers(res.players);
		calculateTotalMoney(res.players,res.diamondMoney);
		broadcast('get-card',{players:res.players, card:res.my3edCards, diamondMoney:res.diamondMoney});
	}

	async function nextPlayer(e) {
		e.target.disabled = true;
		const apiUrlEndpoint = `/api/setNextPlayer`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				diamondMode:isOpenDiamondMode,
				myCards: myCards,
				myMoney: myMoney
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		broadcast('set-next-player',res);
		setDefault(res.players);
		calculateTotalMoney(res.players,res.diamondMoney);
		if(isOpenDiamondMode){
			setDiamondModeDefault();
		}
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
		broadcast('new-game',res);

		// 人物表情 Default
		setClickedGetCard(false);
		setDefault(res.players);
		setNumber(res.game.number);
		setTtlNumber(res.game.ttl);
		setOpenDiamondMode(res.game.diamondMode);
		calculateTotalMoney(res.players,0);
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

	async function gemeOver() {
		const apiUrlEndpoint = `/api/gameOver`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		
		broadcast('game-over',res);
		setBlock("GameOver",res);
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
		setNumber(res.game.number);
		setTtlNumber(res.game.ttl);
		return res;
	}

	function updateRole(autoIncreNum,newPlayerId) {
		let newPlayers = []
		players.forEach((player,index)=>{
			if(player.autoIncreNum == autoIncreNum) {
				player.playerId = newPlayerId;
			}
			newPlayers.push(player);
		});

		setPlayers(newPlayers);
	}

	function setTtlGameNumber(num) {
		setTtlNumber(num);
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

	function clickDiamondBets(value) {
		setDiamondBets(value);
		const data = {player:myId, diamondBets:value};
		broadcast('click-diamond-bets',data);
		resetPlayersDiamondBetsData(data);
	}

	function resetPlayersDiamondBetsData(data) {
		let newPCDB = {};
		newPCDB[data.player.autoIncreNum] = data;
		Object.keys(playersClickDiamondBets).forEach((key)=>{
			if(key != data.player.autoIncreNum) {
				newPCDB[key] = playersClickDiamondBets[key];
			}
		});
		setPlayersClickDiamondBets(newPCDB);
	}

	function setDiamondModeDefault(){
		setPlayersClickDiamondBets({});
		setPlayer3edCard({});
		setDiamondBets(false);
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

	useEffect(()=>{
		switch (broadcastData.name) {
			//登入
			case "login":
				setPlayers(broadcastData.data.players);
				setOpenDiamondMode(broadcastData.data.game.diamondMode);
				calculateTotalMoney(broadcastData.data.players,broadcastData.data.game.diamondMoney);
				break;

			//登出
			case "logout":
				setDefault(broadcastData.data);
				calculateTotalMoney(broadcastData.data,diamondMoney);
				break;

			// 更新all使用者
			case "update-players":
				setPlayers(broadcastData.data.players);
				calculateTotalMoney(broadcastData.data.players,broadcastData.data.game.diamondMoney);
				break;

			//pass
			case "set-next-player":
				setDefault(broadcastData.data.players);
				calculateTotalMoney(broadcastData.data.players,broadcastData.data.diamondMoney);
				if(isOpenDiamondMode){
					setDiamondOverlay(false);
					//setDiamondMoney(broadcastData.data.diamondMoney);
				}
				break;

			//重新遊戲
			case "new-game":
				// 人物表情 Default
				setClickedGetCard(false);
				setDefault(broadcastData.data.players);
				setNumber(broadcastData.data.game.number);
				setTtlNumber(broadcastData.data.game.ttl);
				setOpenDiamondMode(broadcastData.data.game.diamondMode);
				calculateTotalMoney(broadcastData.data.players,0);
				break;

			//更新局數
			case "update-gameNumber":
				setNumber(broadcastData.data.number);
				setTtlNumber(broadcastData.data.ttl);
				break;

			//重新發牌
			case "deal-cards":
				setClickedGetCard(false);
				setPlayers(broadcastData.data.players);
				calculateTotalMoney(broadcastData.data.players,diamondMoney);

				if(isOpenDiamondMode && diamondMoney >= (players.length-1)*100){
					setDiamondOverlay(true);
					setPlayerCards(broadcastData.data.cards);
					setDiamondModeDefault();
				}
				break;

			//射
			case "get-card":
				setClickedGetCard(true);
				setDefault(broadcastData.data.players);
				calculateTotalMoney(broadcastData.data.players,broadcastData.data.diamondMoney);

				if(isOpenDiamondMode && diamondMoney >= (players.length-1)*100){
					setDiamondOverlay(true);
					setPlayer3edCard(broadcastData.data.card);
				}
				break;

			//換角色
			case "update-role":
				updateRole(broadcastData.data.autoIncreNum,broadcastData.data.newPlayerId);
				break;

			//開啟or關閉diamond模式
			case "click-open-diamondMode":
				setOpenDiamondMode(broadcastData.data);
				break;

			//選擇會or不會射中
			case "click-diamond-bets":
				resetPlayersDiamondBetsData(broadcastData.data);
				break;

			default:
				break;

		}
	},[broadcastData]);

	useEffect(()=>{
		//let baseAllMoney = players.length * baseMyMoney;
		//let totalPlayersMoney = 0;
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
			//totalPlayersMoney += player.money;
			if(player.socketId == socketId){
				setMyId(player);
				setMyMoney(player.money);
			}
			if(player.isCurrentPlayer){
				setCurrentPlayer(player)
			}
		});
		//setTotalMoney(baseAllMoney - totalPlayersMoney - diamondMoney);
		setIsAnyPlayerCanPlay(canPlay);
		setIsAnyPlayerCantPlay(someoneCantPlay);
	},[players]);

	useEffect(()=>{
		if(currentPlayer.autoIncreNum == myId.autoIncreNum){
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

		//有幾張能射門
		const difference = myCards[0].number - myCards[1].number;
		if(difference == 0) {
			if(myCards[0].number > 7){
				setPay((myCards[0].number - 1) * 10);
			}else if(myCards[0].number < 7){
				setPay((13 - myCards[0].number) * 10)
			}else {
				setPay(6 * 10)
			}
		}else{
			setPay(difference * 10)
		}
	},[myCards]);

	useEffect(()=>{
		if(totalMoney <= 0){
			getGameNumber();
		}
	},[totalMoney]);

	useEffect(()=>{
		if(!isDiamondOverlay){
			//setPlayerCards(defaultMyCards);
			setDiamondModeDefault();
		}
	},[isDiamondOverlay]);

	useEffect(()=>{
		if(!isOpenDiamondMode){
			setShoot(true);

			//關閉 overlay
			setDiamondOverlay(false);
			calculateTotalMoney(players,0);
		}
	},[isOpenDiamondMode]);

	useEffect(()=>{
		if(diamondMoney >= (players.length-1)*100) {
			setShoot(false);
			if(Object.keys(playersClickDiamondBets).length >= players.length - 1){
				setShoot(true);
			}
		}else{
			setShoot(true);
		}
	},[diamondMoney, playersClickDiamondBets]);

	let the3edCardDev = <>
		<button className={'btn '+'btn-red-outline '+styles.shoot} onClick={getCard} disabled={!isMyTurn || !myCards[0].number || bets<=0 || totalMoney <=0 || !shoot}>射</button>
		<button className={'btn '+'btn-black-outline '+styles.pass} onClick={nextPlayer} disabled={!isMyTurn || !myCards[0].number || totalMoney <=0}>pass</button>
	</>;
	if(my3edCards.imgName) {
		the3edCardDev = '';
	}

	let theDealCardDev = <>
		<button className={'btn '+'btn-red-outline '+styles.deal} onClick={dealCards} disabled={!isMyTurn || myCards[0].number}>重新發牌</button>
	</>
	if(!isAnyPlayerCanPlay || (totalMoney <=0 && isAnyPlayerCantPlay) || gameNumber>=ttlNumber){
		theDealCardDev = <button className={'btn '+'btn-black-outline '+styles.endGame} onClick={gemeOver}>遊戲結束</button>;
	}else if(myMoney<20 && isMyTurn){
		theDealCardDev = <button className={'btn '+'btn-black-outline '+styles.pass} onClick={nextPlayer} disabled={false}>pass</button>;
	}

	const players_img = ['queen','king','prince2','queen-flower','king2','prince'];
	let player3edCardDev = <img src={`/images/players/${players_img[currentPlayer.playerId]}.svg`} />;
	if(player3edCard.imgName) {
		player3edCardDev = '';
	}

	return (
		<>
			<TotalMoney ttlMoney={totalMoney}
			            gameNumber={gameNumber}
			            ttlNumber={ttlNumber}
			            setTtlGameNumber={setTtlGameNumber}
			            broadcast={broadcast}
			            clickOpenDiamondMode={clickOpenDiamondMode}
			            isOpenDiamondMode={isOpenDiamondMode}
			            isDiamondOverlay={isDiamondOverlay}
			            diamondMoney={diamondMoney}/>
			<div className={styles.myGameBoard}>
				<div className={styles.gameBoard}>
					<div className={`${styles.card1} ${pocker['bg-'+myCards[0].imgName]}`}></div>
					<div className={`${styles.card3} ${my3edCards.imgName ? pocker['bg-'+my3edCards.imgName] : ''}`}>{the3edCardDev}</div>
					<div className={`${styles.card2} ${pocker['bg-'+myCards[1].imgName]}`}></div>
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
						<input type="text" value={`$${inputBets}`} onChange={onChangeInputBets} readOnly/>
						<button className={styles.plus} onClick={() => onChangeInputBets('+')}>+</button>
					</div>
				</div>
				<div className={styles.dealCards}>
					{theDealCardDev}
				</div>
			</div>
			<div id={`${styles.menu}`} className={`${isDiamondOverlay? styles.active:''}`}>
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
								                     broadcast={broadcast}
								                     playersClickDiamondBets={playersClickDiamondBets}
								/>)
							})
						}
					</ul>
				</div>
			</div>
			<div className={`${styles.overlay} ${isDiamondOverlay? styles.active:''}`} onClick={()=>setDiamondOverlay(player3edCard.imgName? false : true)}>
				<div className={`${styles.diamondGameBoard}`}>
					<div className={styles.gameBoard}>
						<div className={`${styles.card1} ${pocker['bg-'+playerCards[0].imgName]}`}></div>
						<div className={`${styles.card3} ${player3edCard.imgName ? pocker['bg-'+player3edCard.imgName]+' '+styles.active : ''}`}>{player3edCardDev}</div>
						<div className={`${styles.card2} ${pocker['bg-'+playerCards[1].imgName]}`}></div>
					</div>
				</div>
				<div className={styles.diamondBets}>
					<button className={`btn btn-black-outline ${styles.lose} ${diamondBets===2? styles.active : ''}`} onClick={()=>clickDiamondBets(2)}>不會射中</button>
					<button className={`btn btn-red-outline ${styles.win} ${diamondBets===1? styles.active : ''}`} onClick={()=>clickDiamondBets(1)}>會射中</button>
				</div>
				<div className={`${styles.closeModalHint} ${player3edCard.imgName? styles.active : ''}`}>
					點擊空白處關閉視窗 <img src={"/images/tap.png"} />
				</div>
			</div>
		</>
	)
}