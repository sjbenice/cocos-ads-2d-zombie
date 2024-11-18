import { _decorator, Animation, AudioSource, Node, tween, v3, Vec3 } from 'cc';
import { GameMgr } from '../library/manager/GameMgr';
import { ZombieMgr } from './ZombieMgr';
const { ccclass, property } = _decorator;

@ccclass('MyGameMgr')
export class MyGameMgr extends GameMgr {
    @property(Node)
    dangeGroup:Node[] = [];

    @property(AudioSource)
    dangeSfx:AudioSource = null;

    protected _isDange:boolean = false;

    start() {
        if (this.btnPlay) {
            tween(this.btnPlay)
            .to(0.5, {scale:v3(1.1, 1.1, 1)})
            .to(0.5, {scale: Vec3.ONE})
            .delay(1)
            .union()
            .repeatForever()
            .start();

            this.btnPlay = null;
        }
        
        if (super.start)
            super.start();
    }

    protected lateUpdate(dt: number): void {
        const dangeCount = ZombieMgr.getDangeCount();
        const isDange = dangeCount > 0;
        if (dangeCount > 16 && this.packshot)
            this.packshot.active = true;

        if (isDange != this._isDange) {
            this._isDange = isDange;

            if (this.dangeSfx) {
                if (isDange)
                    this.dangeSfx.play();
                else if (this.dangeSfx.playing)
                    this.dangeSfx.pause();
            }

            this.dangeGroup.forEach(group => {
                const anim = group.getComponent(Animation);
                if (anim) {
                    if (isDange)
                        anim.play();
                    else
                        anim.stop();
                }

                group.getComponentsInChildren(Animation).forEach(anim => {
                    if (isDange)
                        anim.play();
                    else
                        anim.stop();
                })
            })
        }
    }
}


