import styles from "./blinkiesrow.module.scss";
import { Window } from "../Window/Window";
import Image from "next/image";
import angellover from "@/assets/images/blinkies/angellover.gif";
import pinkpink from "@/assets/images/blinkies/pinkpink.gif";
import gyarulover from "@/assets/images/blinkies/gyarulove.gif";
import whereami from "@/assets/images/blinkies/whereami.gif";
import yoursweetness from "@/assets/images/blinkies/yoursweetness.gif";
import dokidoki from "@/assets/images/blinkies/dokidoki.gif";
import pastelangel from "@/assets/images/blinkies/pastelangel.gif";
import mikufan from "@/assets/images/blinkies/mikufan.gif";
import kawaii from "@/assets/images/blinkies/kawaii.gif";
import hellokitty from "@/assets/images/blinkies/hellokitty.gif";
import candyblinky from "@/assets/images/blinkies/candy.gif";
import softwarm from "@/assets/images/blinkies/softwarm.gif";

export const BlinkiesRow = () => {
    return (
        <Window>
            <div className={'windowContent'}>
                <div className={styles.blinkiesRow}>
                    <Image src={angellover} alt="blinkie" width={150} height={20} />
                    <Image src={pinkpink} alt="blinkie" width={150} height={20} />
                    <Image src={gyarulover} alt="blinkie" width={150} height={20} />
                    <Image src={whereami} alt="blinkie" width={150} height={20} />
                    <Image src={yoursweetness} alt="blinkie" width={150} height={20} />
                    <Image src={dokidoki} alt="blinkie" width={150} height={20} />
                    <Image src={pastelangel} alt="blinkie" width={150} height={20} />
                    <Image src={mikufan} alt="blinkie" width={150} height={20} />
                    <Image src={kawaii} alt="blinkie" width={150} height={20} />
                    <Image src={hellokitty} alt="blinkie" width={150} height={20} />
                    <Image src={candyblinky} alt="blinkie" width={150} height={20} />
                    <Image src={softwarm} alt="blinkie" width={150} height={20} />
                </div>
            </div>
        </Window>
    )
}