"use client";

import styles from "./page.module.scss";
import { useState, useEffect, useCallback } from "react";
import { ProfilePanel } from "@/components/ProfilePanel/ProfilePanel";
import { Window } from "@/components/Window/Window";
import { Button } from "@/components/Button/Button";

import Image from "next/image";

import elma from "@/assets/images/homepage/elma.jpg";
import { Calendar } from "@/components/Calendar/Calendar";

import glasscat from "@/assets/images/homepage/glasscat.png";
import Anilist from "@/components/Anilist/Anilist";
import Quiz, { IQuizProps } from "@/components/Quiz/Quiz";
import Survey, { ISurveyProps } from "@/components/Survey/Survey";
import PortfolioPanel, { IPortfolioPanelProps } from "@/components/PortfolioPanel/PortfolioPanel";
import lain from "@/assets/images/homepage/lain.jpg";

import xlogo from "@/assets/images/social media/x.png";
import email from "@/assets/images/social media/email.png";
import linkedin from "@/assets/images/social media/linkedin.png";
import github from "@/assets/images/social media/github.png";

import syncing from "@/assets/images/syncing.gif";
import { VerticalNav } from "@/components/VerticalNav/VerticalNav";
import Link from "next/link";

import lollipop from "@/assets/images/homepage/lollipop.png";
import kissu from "@/assets/images/homepage/kissu.png";
// import sakura from "@/assets/images/sakura.png";
import icecream from "@/assets/images/homepage/icecream.png";

import { MediaPlayer } from "@/components/MediaPlayer/MediaPlayer";

import miku from "@/assets/images/homepage/vaporwavemiku.jpg";

import { IProfilePanelProps } from "@/components/ProfilePanel/ProfilePanel";
import { StatusPanel, IStatusPanelData } from "@/components/StatusPanel/StatusPanel";
import { JournalPanel, IJournalPanelProps } from "@/components/JournalPanel/JournalPanel";
import { FAQPanel, IFAQPanelProps } from "@/components/FAQPanel/FAQPanel";
import { GalleryPreview, IGalleryPreviewProps } from "@/components/GalleryPreview/GalleryPreview";
import { TodoPanel, ITodoPanelProps } from "@/components/TodoPanel/TodoPanel";
import { BlogPanel, IBlogPanelProps } from "@/components/BlogPanel/BlogPanel";
import { StatsPanel } from "@/components/StatsPanel/StatsPanel";
import HeaderBox from "@/components/HeaderBox/HeaderBox";
import { Footer } from "@/components/Footer/Footer";
import { FavoritesPanel, IFavoritesPanelProps } from "@/components/FavoritesPanel/FavoritesPanel";

interface HomeState {
  profile: IProfilePanelProps;
  status: IStatusPanelData;
  journal: IJournalPanelProps;
  faq: IFAQPanelProps;
  gallery: IGalleryPreviewProps;
  todo: ITodoPanelProps;
  favorites: IFavoritesPanelProps;
  blog: IBlogPanelProps;
  quiz: IQuizProps;
  survey: ISurveyProps;
  portfolio: IPortfolioPanelProps | null;
  lastUpdated: string;
}

export default function Home() {
  const [homeData, setHomeData] = useState<HomeState | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch("/api/homepage");
        if (!resp.ok) return;
        const data = await resp.json();
        setHomeData(data as HomeState);
      } catch {
        // ignore for now
      }
    };
    load();
  }, []);

  if (homeData === null) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingText}>
            <h4>Syncing...</h4>
          </div>
        </div>
        <Window header="synchronization">
          <div className={styles.loadingImage}>
            <Image src={syncing} alt="syncing" width={400} height={400} />
          </div>
        </Window>
      </div>
    )
  }

  return (
    <div className={`pageContainer scrollArea`}>
        <div className={`stickyLeft`}>
          <Window header="me" showButtons={true}>
            <ProfilePanel 
              headerText={homeData?.profile?.headerText} 
              subHeaderText={homeData?.profile?.subHeaderText} />
          </Window>
          <div className={styles.showSmall}>
            <VerticalNav />
          </div>
          <div className={styles.hideShort}>
            <Window header="status" showButtons={true}>
              <StatusPanel data={homeData?.status ?? {}} />
            </Window>
          </div>
        </div>

        <div className={styles.homeContainerInner}>
          <div id="top" />
          <div className={styles.windowsGrid}>
            <div className={`${styles.spanFull} ${styles.headerContainer}`}>
              
              <HeaderBox header="James Crovo" subtitle="God's in his heaven, all's right with the world" subtitle2="Revelation 21:1-5" showFlashy={true}>
                <div className={styles.navButtons}>
                  <Link href="/blog">
                    <Button text="Blog" />
                  </Link>
                  <Link href="/aboutme">
                    <Button text="About" />
                  </Link>
                  <Link href="/journal">
                    <Button text="Journal" />
                  </Link>
                  <Link href="/gallery">
                    <Button text="Gallery" />
                  </Link>
                  <Link href="/projects">
                    <Button text="Projects" />
                  </Link>

                  <div className={styles.socialMediaContainer}>
                    <Button small={true} onClick={() => window.open("https://github.com/jamesac42", "_blank")}>
                      <Image src={github} alt="github" width={20} height={20} />
                    </Button>
                    <Button small={true} onClick={() => window.open("https://x.com/fifltriggi", "_blank")}>
                      <Image src={xlogo} alt="x" width={20} height={20} />
                    </Button>
                    <Button small={true} onClick={() => window.open("https://www.linkedin.com/in/jamescrovo", "_blank")}>
                      <Image src={linkedin} alt="linkedin" width={20} height={20} />
                    </Button>
                    <Button small={true} onClick={() => window.open("mailto:jamescrovo450@gmail.com", "_blank")}>
                      <Image src={email} alt="email" width={20} height={20} />
                    </Button>
                  </div>
                </div>
              </HeaderBox>
            </div>

            <div className={`${styles.spanFull}`}>
              <Window header="lain.jpg" showButtons={true}>
                <div className={styles.lainImage}>
                  <Image
                    src={lain}
                    alt="lain"
                    priority
                    className={styles.lainPhoto}
                    sizes="(min-width: 1200px) 65rem, 100vw"
                  />
                  <div className={styles.lainOverlay}>
                    <span className={styles.lainOverlayText}>welcome</span>
                    <span className={styles.blinker}><span className={styles.blinkerInner}></span></span>
                  </div>
                </div>
              </Window>
            </div>

            <div id="blogpost" className={styles.span8}>
              <Window header="latest posts" showButtons={true}>
                <BlogPanel 
                  recentPosts={homeData?.blog?.recentPosts ?? []} 
                  popularPosts={homeData?.blog?.popularPosts ?? []} />
              </Window>
            </div>

            <div id="music" className={styles.span4}>
              <Window header="music playlist" showButtons={true}>
                <div className={'windowContent'}>
                  <MediaPlayer />
                </div>
              </Window>
              <br/>
              <div className={styles.hideSmall}>
                <Window>
                  <div className={`windowContent ${styles.elma}`}>
                    <Image src={elma} alt="elma" width={248} height={247} />
                  </div>
                </Window>
              </div>
            </div>

            <div className={styles.span4}>
              <Window header="favorites" showButtons={true}>
                <FavoritesPanel favorites={homeData?.favorites?.favorites ?? []} />
              </Window>
            </div>

            <div id="faq" className={styles.span8}>
              <Window header="faq" showButtons={true}>
                <FAQPanel faqs={homeData?.faq?.faqs ?? []} />
              </Window>
            </div>

            <div id="gallery" className={styles.spanFull}>
              <Window header="gallery" showButtons={true}>
                <div className={`windowContent`}>
                  <GalleryPreview images={homeData?.gallery?.images ?? []} />
                </div>
              </Window>
            </div>
            
            <div id="todo" className={styles.span4}>
              <Window header="todo" showButtons={true}>
                <TodoPanel todos={homeData?.todo?.todos ?? []} />
              </Window>
            </div>

            <div id="journal" className={styles.span8}>
              <JournalPanel entries={homeData?.journal?.entries ?? []} />
            </div>

            <div id="portfolio" className={styles.spanFull}>
              <Window header="portfolio" showButtons={true}>
                <div className={`windowContent`}>
                  <PortfolioPanel intro={homeData?.portfolio?.intro} projects={homeData?.portfolio?.projects ?? []} />
                </div>
              </Window>
            </div>

            <div className={styles.spanFull}>
                <div className={styles.mikuImage}>
                  <Image
                    src={miku}
                    alt="miku"
                    priority
                    className={styles.mikuPhoto}
                  />
                </div>
            </div>

            <div id="anilist" className={styles.spanFull}>
              <Window header="watch list" showButtons={true}>
                <div className={`windowContent`}>
                  <Anilist user="jamesac42" />
                </div>
              </Window>
            </div>

            <div id="analytics" className={styles.span10}>
              <Window header="telemetry" showButtons={true}>
                <StatsPanel />
              </Window>
            </div>
                        
            <div className={styles.span2}>
              <Image src={kissu} alt="kissu" height={566} width={440} className={styles.paneImage} />
            </div>

            <div className={styles.spanFull}>
              <Footer lastUpdated={homeData?.lastUpdated ?? ""} />
            </div>
          </div>
        </div>

        <div className={`stickyRight ${styles.hideSmall}`}>
          <VerticalNav />
          <Window header="calendar" showButtons={true}>
            <div className={`windowContent`}>
              <Calendar />
            </div>
          </Window>
        </div>
      </div>
  );
}
