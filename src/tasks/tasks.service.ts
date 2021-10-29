import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
const getUuid = require('uuid-by-string');
const PubNub = require('pubnub');
const computerName = require('computer-name');

@Injectable()
export class TasksService {
	private readonly logger = new Logger(TasksService.name);
	private _pubnub;

	constructor() {
		this.logger.debug('connect to PubNub channel');

		const uuid = getUuid(process.env.PUBNUB_SYSTEM_USER_IDENTITY+'-'+Math.floor(Math.random()*999999999));
		const pubnub = new PubNub({
		      publishKey: process.env.PUBNUB_PUBLISH_KEY,
		      subscribeKey: process.env.PUBNUB_SUBSCRIBE_KEY,
		      uuid: uuid
		    });
		const pubnubListener = {
			status: function (statusEvent) {
				console.log('pubnub - statusEvent', statusEvent);
			},
			message: function (messageEvent) {
				console.log('pubnub - messageEvent', messageEvent);
			},
			presence: function (presenceEvent) {
				console.log('pubnub - presenceEvent', presenceEvent);
			}
		}
		pubnub.addListener(pubnubListener);
		pubnub.subscribe({
		    channels: [process.env.PUBNUB_CHANNEL_ID],
		    withPresence: true,
		});
		this._pubnub = pubnub;
	}

	@Cron('*/10 * * * * *')
	handleCron() {
		this.logger.debug('send a message to PubNub channel');
		const message = {
		        storeInHistory: false,
		        message: {
		          content: `Hello, I am ${computerName()}~~`
		        },
		        channel: process.env.PUBNUB_CHANNEL_ID,
		        ttl: 0
		    };
		this._pubnub.publish(
			message
			, function (status, response) {
			    if (status.error) {
			        console.error('pubnub error:', status)
			    } else {
			        console.log("pubnub message Published w/ timetoken:", response.timetoken)
			    }
			}			
		);
	}
}
