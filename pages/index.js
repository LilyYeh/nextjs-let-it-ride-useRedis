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

	const baseMoney = 10;
	const baseMyMoney = 1000;

	async function socketInitializer() {
		await fetch('/api/socket');
		socket = io();

		socket.on('connect', () => {
			setSocketId(socket.id);
		});

		socket.on('update-players', playersData => {
			setBroadcastData({name:'update-players',data:playersData});
		});

		socket.on('set-next-player', playersData => {
			setBroadcastData({name:'set-next-player',data:playersData});
		});

		socket.on('game-over', rankingData => {
			setBlock('GameOver');
		});

		socket.on('new-game', playersData => {
			setBlock('Game',playersData);
			setBroadcastData({name:'new-game',data:playersData});
		});

		socket.on('clicked-getCard', getCardFlag => {
			setBroadcastData({name:'clicked-getCard',data:getCardFlag});
		});

		socket.on('update-gameNumber', gameData => {
			setBroadcastData({name:'update-gameNumber',data:gameData});
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
			setBlock('Game',res)
			setBroadcastData({name:'update-players',data:res});
			socket.emit('update-players',res);
		}
	}

	function broadcast(name,data) {
		socket.emit(name, data);
	}

	function setBlock(name,data) {
		setActiveBlock(name);
		if(name == 'Game'){
			setBroadcastData({name:'new-game',data:data});
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
					setBlock={setBlock}
				/>:null}
				{activeBlock == 'LoginFail'? <GameLoginFail/>:null}
			</div>
		</>
	)
}
