import { Config, Platform } from '../../utils/config';


function CheckInputTag(input: HTMLElement): boolean {

  // 
  function checkKeywords(s: string): boolean {
    for (const keyword of Config["keywords"]) {
      if (s.includes(keyword)) {
        return true;
      }
    }
    return false;
  }

  // self placeholder
  let placeholder = input.getAttribute("placeholder");
  if (placeholder !== null && checkKeywords(placeholder)) {
    return true;
  }

  // parent 
  let parent = input.parentElement;

  for (let i = 0; i < parent.children.length; i++) {
    let innerHTML = parent.children.item(i).innerHTML;
    if (innerHTML !== null && checkKeywords(innerHTML)) {
      return true;
    }
  }
  
  return false;
}

export function getBiBindData(body: HTMLElement): string[] {
  const inputTags = body.getElementsByTagName('input');
  const inputs = [];

  if (Config.platform === Platform.wechat) {
    for (let i = 0; i < inputTags.length; i++) {
      let value = inputTags[i].getAttribute('model:value');
      if (value !== null && CheckInputTag(inputTags[i])) {
        value = value.replace('{{', '');
        value = value.replace('}}', '').trim();
        inputs.push(value);
      }
    }
  } else if (Config.platform === Platform.baidu) {
    for (let i = 0; i < inputTags.length; i++) {
      let value = inputTags[i].getAttribute('model:value');
      if (value !== null && CheckInputTag(inputTags[i])) {
        value = value.replace('{=', '');
        value = value.replace('=}', '').trim();
        inputs.push(value);
      }
    }
  }
  return inputs;
}

export function getInputEventHandlers(body: HTMLElement): string[] {
  const inputTags = body.getElementsByTagName('input');
  const inputEventHandlers:string[] = [];
  for (let i = 0; i < inputTags.length; i++) {
    getHandlers(inputTags[i]);
  }

  getOpenTypeButton(body, inputEventHandlers);
  return inputEventHandlers;

  function getHandlers(inputTag: HTMLElement) {
    for (const event of Config.input_events) {
      let handler = inputTag.getAttribute(event);
      if (handler !== null && CheckInputTag(inputTag)) {
        if (handler.charAt(0) === '\'' && handler.charAt(handler.length-1) === '\''){
          handler = handler.substring(1,handler.length-1);
        }
        inputEventHandlers.push(handler);
      }
    }
  }
}

function getOpenTypeButton(body: HTMLElement, inputEventHandlers:string[]){
  const buttonTags = body.getElementsByTagName('button');
  for (let i = 0; i < buttonTags.length; i++) {
    const opentype = buttonTags[i].getAttribute('open-type');
    if (opentype !== null && opentype === 'getPhoneNumber') {
      let handler = buttonTags[i].getAttribute('bindgetphonenumber')
      if (handler.charAt(0) === '\'' && handler.charAt(handler.length-1) === '\''){
        handler = handler.substring(1,handler.length-1);
      }
      inputEventHandlers.push(handler);
    }
  }
}
