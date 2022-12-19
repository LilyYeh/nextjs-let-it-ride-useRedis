export function passPay(myCards) {
	//有幾張能射門
	const difference = myCards[0].number - myCards[1].number;
	if(difference == 0) {
		if(myCards[0].number > 7){
			return (myCards[0].number - 1) * 5;
		}else if(myCards[0].number < 7){
			return (13 - myCards[0].number) * 5;
		}else {
			return 6 * 5;
		}
	}else{
		return difference * 5;
	}
}

export function diamondPay(diamondMoney,players,diamondBets,myCards) {
	const difference = myCards[0].number - myCards[1].number - 1;

	let pay = 0;
	if(diamondBets === 1) {
		//會射中
		if(difference === -1){
			if(myCards[0].number > 9){
				pay = (13 - myCards[0].number + 1) * 10;
			}else if(myCards[0].number < 5){
				pay = myCards[0].number * 10;
			}else {
				pay = 5 * 10;
			}
		}else if(difference >= 10){
			pay = 10;
		}else{
			pay = (11 - difference) * 10;
		}
	}else if(diamondBets === 2) {
		//不會射中
		if(difference === -1){
			if(myCards[0].number > 7 ){
				pay = (myCards[0].number - 3) * 10;
			}else if(myCards[0].number < 7){
				pay = (13 - myCards[0].number - 2) * 10;
			}else {
				pay = 5 * 10;
			}
		}else if(difference <= 2){
			pay = 10;
		}else{
			pay = (difference - 1) * 10;
		}
	}
	const ttlPay = Math.floor(((diamondMoney/(players.length-1)) * pay/100)/5)*5;
	return ttlPay;
}