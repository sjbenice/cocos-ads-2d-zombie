import { _decorator, Component, instantiate, Node, Prefab, randomRange, randomRangeInt, tween, Vec3 } from 'cc';
import { SoundMgr } from '../library/manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('GunController')
export class GunController extends Component {
    @property(Prefab)
    firePrefab:Prefab = null;

    @property(Node)
    placePos:Node = null;

    @property
    xVar:number = 0;


    protected _tempPos:Vec3 = Vec3.ZERO.clone();

    start() {

    }

    public fire(worldPos:Vec3, duration:number) {
        if (this.node.activeInHierarchy && this.firePrefab) {
            const fire = instantiate(this.firePrefab);
            this.placePos.addChild(fire);

            this._tempPos.set(Vec3.ZERO);
            this._tempPos.x = randomRange(-this.xVar, this.xVar);
            fire.setPosition(this._tempPos);
            fire.getWorldPosition(this._tempPos);

            const yDelta = worldPos.y - this._tempPos.y;
            this._tempPos.set(Vec3.ZERO);
            if (yDelta > 0)
                this._tempPos.y = yDelta;

            const sound_i = randomRangeInt(1, 6);
            // SoundMgr.playSound('gun_shot');
            SoundMgr.playSound(`shell_${sound_i}`);

            tween(fire)
            .by(duration, {position:this._tempPos})
            .call(() => {
                fire.removeFromParent();
                fire.destroy();
            })
            .start();
        }
    }
}


