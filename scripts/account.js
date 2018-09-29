function accountDeletionConditionsChange(event) {
	switch(event.currentTarget.id) {
		case "placesLeaveNone" :
			document.getElementById("imagesLeaveNone").click();
			break;
		case "imagesLeaveAll" :
			if(document.getElementById("placesLeaveNone").checked) {
				document.getElementById("placesLeaveCommon").click();
			}
			break;
	}
}
