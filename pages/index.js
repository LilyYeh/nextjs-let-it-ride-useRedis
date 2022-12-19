import Head from 'next/head';
import styles from './index.module.scss';
import { useEffect, useState } from 'react';
import Game from './game';
import GameOver from './gameOver';
import GameLoginFail from './gameLoginFail';
import io from "socket.io-client";
let socket;

export default function Home() {
	const [ socketId, setSocketId ] = useState('');
	const [ activeBlock, setActiveBlock ] = useState('');
	const [ broadcastData, setBroadcastData ] = useState({name:"",data:[]});

	const baseMoney = 30;
	const baseMyMoney = 2000;

	async function socketInitializer() {
		await fetch('/api/socket');
		socket = io();

		socket.on('connect', () => {
			setSocketId(socket.id);
		});

		//登出
		socket.on('logout', playersData => {
			setBroadcastData({name:'logout',data:playersData});
		});

		// 更新all使用者
		socket.on('update-players', playersData => {
			setBroadcastData({name:'update-players',data:playersData});
		});

		//pass
		socket.on('set-next-player', data => {
			setBroadcastData({name:'set-next-player',data:data});
		});

		//遊戲結束
		socket.on('game-over', data => {
			setBlock('GameOver',data);
		});

		//重新遊戲
		socket.on('new-game', data => {
			setBlock('Game',data);
			//setBroadcastData({name:'new-game',data:playersData});
		});

		//更新局數
		socket.on('update-gameNumber', gameData => {
			setBroadcastData({name:'update-gameNumber',data:gameData});
		});

		//重新發牌
		socket.on('deal-cards', data => {  //data.players, data.cards
			setBroadcastData({name:'deal-cards',data:data});
		});

		//射
		socket.on('get-card', getCardFlag => {
			setBroadcastData({name:'get-card',data:getCardFlag});
		});

		//換角色
		socket.on('update-role', data => {  //data.players, data.card
			setBroadcastData({name:'update-role',data:data});
		});

		//開啟or關閉diamond模式
		socket.on('click-open-diamondMode', data => {  //player:myId, diamondBets:value
			setBroadcastData({name:'click-open-diamondMode',data:data});
		});

		//選擇會or不會射中
		socket.on('click-diamond-bets', data => {  //player:myId, diamondBets:value
			setBroadcastData({name:'click-diamond-bets',data:data});
		});
	}

	async function playerLogin() {
		const apiUrlEndpoint = `/api/playerLogin`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				socketId: socketId,
				baseMoney: baseMoney,
				baseMyMoney: baseMyMoney
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		let res = await response.json();
		if(res.error=="login fail"){
			setBlock('LoginFail')
			setActiveBlock('LoginFail');
		}else{
			setBlock('Game');
			setBroadcastData({name:'login',data:res});
			socket.emit('update-players',res);
		}
	}

	function broadcast(name,data) {
		socket.emit(name, data);
	}

	function setBlock(name,data) {
		setActiveBlock(name);
		if(name == 'Game' && data){
			setBroadcastData({name:'new-game',data:data});
		}else if(name == 'GameOver' && data){
			setBroadcastData({name:'game-over',data:data});
		}
	}

	useEffect(()=>{
		socketInitializer();
	},[]);

	useEffect(()=>{
		async function f(){
			if(socketId!==''){
				await playerLogin();
			}
		}
		f();
	},[socketId]);

	return (
		<>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0" />
				<title>射龍門</title>
			</Head>
			<div className={`${styles.mainContent} ${styles[activeBlock]}`}>
				<h1 className={styles.h1}></h1>
				{activeBlock == 'Game'? <Game
					socketId={socketId}
					baseMoney={baseMoney}
					baseMyMoney={baseMyMoney}
					broadcast={broadcast}
					broadcastData={broadcastData}
					setBlock={setBlock}
				/>:null}
				{activeBlock == 'GameOver'? <GameOver
					baseMoney={baseMoney}
					baseMyMoney={baseMyMoney}
					broadcast={broadcast}
					broadcastData={broadcastData}
					setBlock={setBlock}
				/>:null}
				{activeBlock == 'LoginFail'? <GameLoginFail/>:null}
			</div>
		</>
	)
}
