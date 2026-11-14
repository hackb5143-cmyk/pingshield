import type { EmailStatus } from './contact-types';
export function emailStatusText(status?:EmailStatus) {
  switch(status){
    case 'sending':return 'Email submission is awaiting confirmation…';
    case 'accepted':return 'Owner email alert accepted by email service.';
    case 'browser_accepted':return 'Browser reported the owner email submission was accepted.';
    case 'activation_required':return 'Message saved. Owner email activation is pending.';
    case 'rate_limited':return 'Message saved. Email alert paused by the notification limit.';
    case 'failed':return 'Message saved. Email alert could not be submitted.';
    case 'unknown':return 'Message saved. Email delivery could not be confirmed.';
    default:return '';
  }
}
