import styles from "../index.module.scss";
import useRate from "../tools/useRate";
import {useEffect, useState, useRef, useContext} from "react";
import BroadcastContext from "../context/ControlContext";

export default function totalMoney({ttlMoney,gameNumber,ttlNumber,setTtlGameNumber,clickOpenDiamondMode,isOpenDiamondMode,setDiamondOverlay,diamondMoney}) {
	const props = useContext(BroadcastContext);
	const broadcast = props.broadcast;

	const [rate,setRate]=useState(0);

	const [ isGameSettingOpen, setGameSettingOpen ] = useState(false);
	const [ isOverlayOpen, setOverlayOpen ] = useState(false);
	const mounted=useRef();

	function openSetting() {
		setGameSettingOpen(!isGameSettingOpen);
		setOverlayOpen(!isGameSettingOpen);
	}

	function closeSetting() {
		setGameSettingOpen(false);
		setOverlayOpen(false);
	}

	async function onChangeGameNum(value) {
		const multiPlus = ttlNumber >= 20 && ttlNumber < 90 ? 10 : 1;
		const multiMinus = ttlNumber > 20 && ttlNumber <= 90 ? 10 : 1;
		const input = value=='+' ? ttlNumber + 1 * multiPlus : ttlNumber - 1 * multiMinus;

		if(input > 100 || input < 0) {
			return ttlNumber;
		}else{
			setTtlGameNumber(input);
		}
	}

	async function setTtlGame() {
		const apiUrlEndpoint = `/api/gameNumber`;
		const getData = {
			method: "POST",
			header: { "Content-Type": "application/json" },
			body: JSON.stringify({
				ttlGameNumber: ttlNumber
			})
		}
		const response = await fetch(apiUrlEndpoint, getData);
		const res = await response.json();
		broadcast('update-gameNumber',res.game);
		return res;
	}

	useEffect(()=>{
		if(!mounted.current){ //componentDidMount
			mounted.current=true;
		}else{
			if(!isGameSettingOpen) {
				setTtlGame();
			}
		}
	},[isGameSettingOpen]);

	useEffect(()=>{
		if(setTtlGameNumber){
			setTtlGameNumber(ttlNumber);
		}
	},[ttlNumber]);

	let mydev = <>{useRate(diamondMoney)}</>;
	if(!isOpenDiamondMode){
		mydev = <>開啟</>;
	}

	/*useEffect(()=>{
		let tm;
		tm = setInterval(()=>{
			setRate(count => {
				console.log(ttlMoney,count);
				if(ttlMoney > count){
					return count + 1;
				}else if(ttlMoney < count){
					return count - 1;
				}else{
					clearInterval(tm);
					return count;
				}
			});
		},20);

		return() => clearInterval(tm);
	},[ttlMoney]);*/

	return (
		<>
			<div className={styles.topColumn}>
				<div className={styles.playNum}>
					<div className={styles.title}>局數
						<div className={`${styles.gameSetting} ${isGameSettingOpen? styles.active:''} ${setTtlGameNumber? '':styles.hidden}`} onClick={openSetting}></div>
					</div>
					<div>{gameNumber} / {ttlNumber}</div>
					<div className={`${styles.settingBoard} ${isGameSettingOpen? styles.active:''}`} >
						<label>設定總局數</label>
						<div className={styles.settingBtn}>
							<button className={styles.minus} onClick={() => onChangeGameNum('-')}>–</button>
							<input type="text" value={ttlNumber} readOnly/>
							<button className={styles.plus} onClick={() => onChangeGameNum('+')}>+</button>
						</div>
					</div>
				</div>
				<div className={`${styles.overlay} ${isOverlayOpen? styles.active:''}`} onClick={closeSetting}></div>
				<div className={styles.publicMoney}><img src={"/images/publicMoney.png"}/>{useRate(ttlMoney)}</div>
				<div className={`${styles.otherMoney} ${setDiamondOverlay? styles.active:''} ${isOpenDiamondMode? '':styles.disabled}`} onClick={()=>clickOpenDiamondMode(isOpenDiamondMode?false:true)}>
					<img src={"/images/otherMoney.png"}/>{mydev}
				</div>
			</div>
		</>
	)
}