import styles from "./index.module.scss";
import pocker from "./pocker.module.scss";
import PlayerMoney from "./components/playerMoney";
import TotalMoney from "./components/totalMoney";
import {useEffect, useState, useMemo, useContext} from "react";
import { useImmer } from 'use-immer';
import {passPay,diamondPay} from "./tools/pay";
import BroadcastContext from './context/ControlContext';

export default function game({socketId}) {
	const props = useContext(BroadcastContext);
	const baseMoney = props.baseMoney;
	const baseMyMoney = props.baseMyMoney;
	const broadcast = props.broadcast;
	const broadcastData = props.broadcastData;
	const setBlock = props.setBlock;

	const [ myId, setMyId ] = useState(0);
	const [ myMoney, setMyMoney ] = useState(baseMyMoney);
	const [ players, setPlayers ] = useImmer([]);
	const [ currentPlayer, setCurrentPlayer ] = useState({});
	const [ isAnyPlayerCanPlay, setIsAnyPlayerCanPlay ] = useState(false);
	const [ isAnyPlayerCantPlay, setIsAnyPlayerCantPlay ] = useState(false);

	//myCards[0]、myCards[1] 龍柱
	const defaultMyCards = [{"number":0,"type":"","imgName":"back"},{"number":0,"type":"","imgName":"back"}]
	const [ myCards, setMyCard ] = useState(defaultMyCards);
	const [ my3edCards, set3edCard ] = useState({});
	const [ isMyCardsFlipped, setMyCardsFlipped ] = useState(false);
	const [ isMy3edCardsFlipped, setMy3edCardsFlipped ] = useState(false);
	const [ getCardFlag, setClickedGetCard ] = useState(false);

	const betsButtons = [30,50,100];
	const [ inputBets, setInputBets ] = useState(0);
	const [ buttonBets, setButtonBets ] = useState(0);
	const [ bets, setBets ] = useState(0);
	const [ bigOrSmall, setBigOrSmall ] = useState('');

	const [ isNavOpen, setNavOpen ] = useState(false);

	const [ gameNumber, setNumber ] = useState(0);
	const [ ttlNumber, setTtlNumber ] = useState(10);

	const diamondBaseMoney = 5;
	const [ isOpenDiamondMode, setOpenDiamondMode] = useState(false);
	const [ diamondMoney, setDiamondMoney ] = useState(0);
	const [ isDiamondOverlay, setDiamondOverlay ] = useState(false);
	const [ playerCards, setPlayerCards ] = useState(defaultMyCards);
	const [ player3edCard, setPlayer3edCard ] = useState({});
	const [ diamondBets, setDiamondBets ] = useState(false); //1:會射中; 2:不會射中
	const [ playersClickDiamondBets, setPlayersClickDiamondBets ] = useImmer({});
	const [ shoot, setShoot ] = useState(true);

	// 輪到我了？
	const isMyTurn = useMemo(() => setMyTurn(currentPlayer,myId),[currentPlayer,myId]);
	// 計算 pass 賠$
	const payPass = useMemo(() => passPay(myCards) ,[myCards]);
	// 計算獲得 Diamond money 的$
	const payShoot = useMemo(() => setPayShoot(playerCards) ,[playerCards]);
	// 計算總金額
	const totalMoney = useMemo(() => calculateTotalMoney(players,diamondMoney) ,[players,diamondMoney]);
	// 可以射？
	const canShoot = useMemo(() => {
		if(!isMyTurn || !myCards[0].number || totalMoney <=0 || bets<=0 || !shoot){
			return false;
		}
		return true;
	} ,[isMyTurn, myCards[0].number, totalMoney, bets, shoot]);

	// 重新發牌
	async function dealCards(e) {
		e.target.disabled = true;

		// 人物表情 Default
		setClickedGetCard(false);

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
		broadcast('deal-cards',{players:res.players, cards:res.cards});
		setDiamondModeDefault();
	}
	// 射
	async function getCard(e) {
		if(!canShoot) return;

		// 人物表情變換
		setClickedGetCard(true);

		setShoot(false);
		const apiUrlEndpoint = `/api/getCard`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				myCards: myCards,
				bets: bets,
				bigOrSmall: bigOrSmall,
				totalMoney: totalMoney,
				gameNumber: gameNumber,
				isOpenDiamondMode: isOpenDiamondMode,
				diamondMoney: diamondMoney,
				diamondBets: playersClickDiamondBets,
				diamondBaseMoney: diamondBaseMoney
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		set3edCard(res.my3edCards);
		setPlayers(res.players);
		setNumber(res.gameNumber);
		setDiamondMoney(res.diamondMoney);
		broadcast('get-card',res);
		setShoot(true);
	}
	// pass
	async function nextPlayer(e) {
		e.target.disabled = true;

		const apiUrlEndpoint = `/api/setNextPlayer`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				baseMoney: baseMoney,
				diamondMode: isOpenDiamondMode,
				myMoney: myMoney,
				payPass: payPass
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		broadcast('set-next-player',res);
		setDefault(res.players);
		setDiamondMoney(res.diamondMoney);
		setDiamondModeDefault();
	}
	// 輪到我了？
	function setMyTurn(currentPlayer,myId){
		if(currentPlayer.autoIncreNum == myId.autoIncreNum){
			return true;
		}
		return false;
	}
	// 下注(- +)
	async function onChangeInputBets(value) {
		let input = 0;
		if(value=='+'){
			if(buttonBets){
				input = inputBets + buttonBets;
			}else{
				input = bets + baseMoney;
			}
		}else if(value=='-'){
			if(buttonBets){
				//input = inputBets - buttonBets;
				input = inputBets - baseMoney;
			}else{
				input = bets - baseMoney;
			}
		}
		const myBets = await checkBets(input);
		setInputBets(myBets);
		setBets(myBets);
	}
	// 下注(button)
	async function onChangeButtonBets(value) {
		const myBets = await checkBets(value);
		if(myBets == value) {
			setButtonBets(value);
			setInputBets(value);
			setBets(value);
		}
	}
	// 下注(確認金額)
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

		// 人物表情 Default
		setClickedGetCard(false);
		setDefault(res.players);
		setNumber(res.game.number);
		setTtlNumber(res.game.ttl);
		setOpenDiamondMode(res.game.diamondMode);
		setDiamondOverlay(false);
		setDiamondMoney(0)
	}
	// 遊戲結束
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
	// 初始狀態(主畫面)
	function setDefault(playersData) {
		//卡片翻背面
		setMyCardsFlipped(false);
		setTimeout(function() {
			setMyCard(defaultMyCards);
			set3edCard({});
		}, 1000);
		setPlayers(playersData);
		setBets(0);
		setInputBets(0);
		setButtonBets(0);
		setNavOpen(false);
	}
	// 換角色
	function updateRole(autoIncreNum,newPlayerId) {
		setPlayers(draft => {
			const player = draft.find(p =>
				p.autoIncreNum == autoIncreNum
			);
			player.playerId = newPlayerId;
		});
	}
	// 設定總局數
	function setTtlGameNumber(num) {
		setTtlNumber(num);
	}
	// 開啟 Diamond Mode
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
	// 賭會射中or不會射中(玩家點選)
	function clickDiamondBets(value) {
		setDiamondBets(value);
		const data = {player:myId, diamondBets:value};
		broadcast('click-diamond-bets',data);
		resetPlayersDiamondBetsData(data);
	}
	// 賭會射中or不會射中(儲存點選資料)
	function resetPlayersDiamondBetsData(data) {
		setPlayersClickDiamondBets(draft => {
			draft[data.player.autoIncreNum] = data
		});
	}
	// 初始狀態(Diamond Mode)
	function setDiamondModeDefault(){
		setPlayersClickDiamondBets({});
		setPlayer3edCard({});
		setDiamondBets(false);
	}
	// 計算獲得 Diamond money 的$。
	function setPayShoot(playerCards){
		const yes = diamondPay(diamondMoney,players,1,playerCards);
		const no = diamondPay(diamondMoney,players,2,playerCards);
		return {yes:yes,no:no};
	}
	// 計算總金額
	function calculateTotalMoney(players,diamondMoney) {
		let baseAllMoney = players.length * baseMyMoney;
		let totalPlayersMoney = 0;
		players.forEach((player)=>{
			totalPlayersMoney += player.money;
		});
		return baseAllMoney - totalPlayersMoney - diamondMoney;
	}

	// 接收廣播
	useEffect(()=>{
		switch (broadcastData.name) {
			//登入
			case "login":
				setPlayers(broadcastData.data.players);
				setOpenDiamondMode(broadcastData.data.game.diamondMode);
				setDiamondMoney(broadcastData.data.game.diamondMoney);
				break;

			//登出
			case "logout":
				setDefault(broadcastData.data);
				break;

			// 更新all使用者
			case "update-players":
				setPlayers(broadcastData.data.players);
				//setDiamondMoney(broadcastData.data.game.diamondMoney);
				break;

			//pass
			case "set-next-player":
				setDefault(broadcastData.data.players);
				setDiamondMoney(broadcastData.data.diamondMoney);
				if(isOpenDiamondMode){
					setDiamondOverlay(false);
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
				setDiamondOverlay(false);
				setDiamondMoney(0);
				break;

			//更新局數
			case "update-gameNumber":
				setNumber(broadcastData.data.number);
				setTtlNumber(broadcastData.data.ttl);
				break;

			//重新發牌
			case "deal-cards":
				//卡片翻背面
				setMyCardsFlipped(false);
				setClickedGetCard(false);
				setPlayers(broadcastData.data.players);
				if(isOpenDiamondMode && diamondMoney >= (players.length-1)*diamondBaseMoney){
					setDiamondOverlay(true);
					setPlayerCards(broadcastData.data.cards);
					setDiamondModeDefault();
				}
				break;

			//射
			case "get-card":
				setClickedGetCard(true);
				setNumber(broadcastData.data.gameNumber);
				setDefault(broadcastData.data.players);
				setDiamondMoney(broadcastData.data.diamondMoney);

				if(isOpenDiamondMode && diamondMoney >= (players.length-1)*diamondBaseMoney){
					setDiamondOverlay(true);
					setPlayer3edCard(broadcastData.data.my3edCards);
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
	// player data 更新 → 判斷是否結束遊戲。
	useEffect(()=>{
		let canPlay = false;
		let someoneCantPlay = false;
		players.forEach((player,index)=>{
			if(player.money >= baseMoney){
				//還有人有錢
				canPlay = true;
			}
			if(player.money < baseMoney){
				//有人沒錢了
				someoneCantPlay = true;
			}

			if(player.socketId == socketId){
				setMyId(player);
				setMyMoney(player.money);
			}
			if(player.isCurrentPlayer){
				setCurrentPlayer(player)
			}
		});
		setIsAnyPlayerCanPlay(canPlay);
		setIsAnyPlayerCantPlay(someoneCantPlay);
	},[players]);
	// 如果有人離線，然後輪到我，自動關閉 overlay。
	useEffect(()=>{
		if(isMyTurn && !player3edCard.imgName){
			setDiamondOverlay(false);
		}
	},[isMyTurn]);
	// 卡片翻正面、下注(比大比小)
	useEffect(()=>{
		if(myCards[0].number!==0){
			setMyCardsFlipped(true);
		}else{
			setMyCardsFlipped(false);
		}

		if(myCards[0].number!==0 && myCards[0].number == myCards[1].number){
			if(myCards[0].number >= 7){
				setBigOrSmall('small');
			}else{
				setBigOrSmall('big')
			}
		}
	}, [myCards]);
	// 關閉 Diamond Overlay → 初始狀態(Diamond Mode)。
	useEffect(()=>{
		if(!isDiamondOverlay){
			setDiamondModeDefault();
		}
	},[isDiamondOverlay]);
	// 關閉 Diamond Mode → 1.射=true 2.關閉 overlay 3.Diamond Money 移到金幣池。
	useEffect(()=>{
		if(!isOpenDiamondMode){
			//關閉 overlay
			setDiamondOverlay(false);
			setDiamondMoney(0);
		}
	},[isOpenDiamondMode]);
	// diamondMoney > 0 && 玩家們完成跟賭 → 打開 Overlay & 射。
	useEffect(()=>{
		//1.open diamond mode;  2.money >= (players-1)x5;  3.尚有玩家'未點選'「會中or不會中」;
		if(isOpenDiamondMode && diamondMoney >= (players.length-1)*diamondBaseMoney && Object.keys(playersClickDiamondBets).length < players.length - 1) {
			setShoot(false);
		}else{
			setShoot(true);
		}
	},[isOpenDiamondMode, diamondMoney, playersClickDiamondBets]);

	let theDealCardDev = <>
		<button className={'btn '+'btn-red-outline '+styles.deal} onClick={dealCards} disabled={!isMyTurn || myCards[0].number}>重新發牌</button>
	</>
	if(!isAnyPlayerCanPlay || (totalMoney <=0 && isAnyPlayerCantPlay) || gameNumber>=ttlNumber){
		theDealCardDev = <button className={'btn '+'btn-black-outline '+styles.endGame} onClick={gemeOver}>遊戲結束</button>;
	}else if((myMoney < baseMoney || isMyCardsFlipped) && isMyTurn){
		theDealCardDev = <>
			<button className={'btn '+'btn-black-outline '+styles.pass} onClick={nextPlayer} disabled={false}>pass</button>
			<label className={`${styles.passPay} ${isOpenDiamondMode && payPass>0? styles.active:''}`}>賠 <span className={styles.money}><img src={"/images/otherMoney.png"}/>{payPass}</span></label>
		</>;
	}

	return (
		<>
			<TotalMoney ttlMoney={totalMoney}
			            gameNumber={gameNumber}
			            ttlNumber={ttlNumber}
			            setTtlGameNumber={setTtlGameNumber}
			            clickOpenDiamondMode={clickOpenDiamondMode}
			            isOpenDiamondMode={isOpenDiamondMode}
			            isDiamondOverlay={isDiamondOverlay}
			            diamondMoney={diamondMoney}/>
			<div className={styles.myGameBoard}>
				<div className={`${styles.gameBoard} ${isMyCardsFlipped? styles.flipped : ''}`}>
					<div className={`${styles.cardWrapper} ${isMyCardsFlipped? styles.flipped : ''}`}>
						<div className={`${styles.card1} ${pocker['bg-back']}`}></div>
						<div className={`${styles.card1} ${pocker['bg-'+myCards[0].imgName]}`}></div>
					</div>
					<div className={`${styles.cardWrapper} ${my3edCards.imgName? styles.flipped : ''}`} onClick={getCard}>
						<div className={`${styles.card3} ${pocker['bg-back']}`}></div>
						<div className={`${styles.card3} ${pocker['bg-'+my3edCards.imgName]}`}></div>
						<img className={`${styles.clickHint} ${canShoot? styles.active : ''}`} src={"/images/tap-2.png"} />
					</div>
					<div className={`${styles.cardWrapper} ${isMyCardsFlipped? styles.flipped : ''}`}>
						<div className={`${styles.card2} ${pocker['bg-back']}`}></div>
						<div className={`${styles.card2} ${pocker['bg-'+myCards[1].imgName]}`}></div>
					</div>
				</div>
				<div className={`${styles.bets} ${isMyCardsFlipped? styles.active : ''}`}>
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
								                     getCardFlag={getCardFlag}
								                     updateRole={updateRole}
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
						<div className={`${styles.card3} ${player3edCard.imgName ? pocker['bg-'+player3edCard.imgName]+' '+styles.active : pocker['bg-back']}`}></div>
						<div className={`${styles.card2} ${pocker['bg-'+playerCards[1].imgName]}`}></div>
					</div>
				</div>
				<div className={styles.diamondBets}>
					<button className={`btn btn-black-outline ${styles.lose} ${diamondBets===2? styles.active : ''}`} onClick={()=>clickDiamondBets(2)}>不會射中</button>
					<button className={`btn btn-red-outline ${styles.win} ${diamondBets===1? styles.active : ''}`} onClick={()=>clickDiamondBets(1)}>會射中</button>
				</div>
				<div className={`${styles.diamondPayHint} ${styles.active}`}>
					會射中：如果猜中賺 <img src={"/images/otherMoney.png"}/> {payShoot.yes} <br/>
					不會射中：如果猜中賺 <img src={"/images/otherMoney.png"}/> {payShoot.no}
				</div>
				<div className={`${styles.closeModalHint} ${player3edCard.imgName? styles.active : ''}`}>
					點擊空白處關閉視窗 <img src={"/images/tap-1.png"} />
				</div>
			</div>
		</>
	)
}