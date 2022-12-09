import { Server } from 'socket.io';
import {removePlayers} from "../../lib/redis_player";

export default function handler(req, res) {
	// It means that socket server was already initialised
	if (res.socket.server.io) {
		console.log("Already set up");
		res.end();
		return;
	}

	const io = new Server(res.socket.server);
	res.socket.server.io = io;

	let playersData;
	io.on('connection', socket => {
		socket.on('disconnect', () => {
			console.log(`${socket.id} disconnect !`);
			async function disconn(){
				playersData = await removePlayers(socket.id);
				socket.broadcast.emit('set-next-player', playersData);
			}
			disconn();
		});

		// 更新all使用者
		socket.on('update-players', playersData => {
			socket.broadcast.emit('update-players', playersData);
		});

		//pass
		socket.on('set-next-player', playersData => {
			socket.broadcast.emit('set-next-player', playersData);
		});

		//遊戲結束
		socket.on('game-over', rankingData => {
			socket.broadcast.emit('game-over', rankingData);
		});

		//重新遊戲
		socket.on('new-game',  playersData => {
			socket.broadcast.emit('new-game', playersData);
		});

		//更新局數
		socket.on('update-gameNumber',  gameData => {
			socket.broadcast.emit('update-gameNumber', gameData);
		});

		//重新發牌
		socket.on('deal-cards', data => {
			socket.broadcast.emit('deal-cards', data);
		});

		//射
		socket.on('get-card', data => {
			socket.broadcast.emit('get-card', data);
		});

		//換角色
		socket.on('update-role', data => {
			socket.broadcast.emit('update-role', data);
		});

		//開啟or關閉diamond模式
		socket.on('click-open-diamondMode', data => {
			socket.broadcast.emit('click-open-diamondMode', data);
		});

		//選擇會or不會射中
		socket.on('click-diamond-bets', data => {
			socket.broadcast.emit('click-diamond-bets', data);
		});

	});
	res.end();
}