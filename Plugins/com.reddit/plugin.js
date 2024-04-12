
// com.reddit

function identify() {
	if (subreddit != null && subreddit.length > 0) {
		sendRequest(`${site}/r/${subreddit}/hot.json?raw_json=1`, "HEAD")
		.then((dictionary) => {
			const jsonObject = JSON.parse(dictionary);
			
			if (jsonObject.status == 200) {
				setIdentifier(subreddit);
			}
			else {
				setIdentifier(null);
			}
		})
		.catch((requestError) => {
			setIdentifier(null);
		});
	}
	else {
		setIdentifier(null);
	}
}

function load() {
	sendRequest(`${site}/r/${subreddit}/hot.json?raw_json=1`, "GET")
	.then((text) => {
		const jsonObject = JSON.parse(text);
		
		var results = [];
		
		for (const child of jsonObject.data.children) {
			const item = child.data;
			
			const author = item["author"];
			const avatar = "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-180x180.png";
			const creatorUri = "https://www.reddit.com/user/" + author;
			var creator = Creator.createWithUriName(creatorUri, author)
			creator.avatar = avatar

			const date = new Date(item["created_utc"] * 1000);
			const uri = "https://www.reddit.com" + encodeURI(item["permalink"]);
			const content = item["title"];

			var attachments = null;
			if (item["gallery_data"] != null) {
				attachments = [];
				const galleryItems = item["gallery_data"].items;
				for (const galleryItem of galleryItems) {
					const mediaId = galleryItem["media_id"];
					const mediaMetadata = item["media_metadata"];
					if (mediaMetadata != null) {
						const metadata = mediaMetadata[mediaId];
						const image = metadata.s.u;
						// TODO: Use the metadata.p.u URL as a thumbnail.
						if (image != null && attachments.length < 4) {
							const attachment = Attachment.createWithMedia(image);
							attachments.push(attachment);
						}
					}
					else {
						// NOTE: This might be an appropriate fallback: "https://i.redd.it/" + galleryItem["media_id"] + ".jpg";
					}
				}
			}
			else {
				const image = item["url"];
				if (image != null) {
					if (image.endsWith(".jpg") || image.endsWith(".jpeg")) {
						const attachment = Attachment.createWithMedia(image);
						attachments = [attachment];
					}
					else {
						const thumbnail = item["thumbnail"];
						if (thumbnail != null) {
							const attachment = Attachment.createWithMedia(thumbnail);
							attachments = [attachment];
						}
					}
				}
			}
			
			const post = Post.createWithUriDateContent(uri, date, content);
			post.creator = creator;
			post.attachments = attachments;
			
			results.push(post);			
		}
		
		processResults(results, true);
	})
	.catch((requestError) => {
		processError(requestError);
	});	
}
