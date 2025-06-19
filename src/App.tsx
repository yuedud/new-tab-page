import { createSignal, createEffect, Show, For, onCleanup } from 'solid-js';
import styles from './App.module.css';

// 背景图片路径
const BG_IMG = '/bg.jpg';

// 天气API Key（请替换为你自己的OpenWeatherMap API Key）
const WEATHER_API_KEY = '';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

function useLocalStorage<T>(key: string, initialValue: T) {
    const stored = localStorage.getItem(key);
    const [value, setValue] = createSignal<T>(stored ? JSON.parse(stored) : initialValue);
    createEffect(() => {
        localStorage.setItem(key, JSON.stringify(value()));
    });
    return [value, setValue] as const;
}

function getGreeting(date: Date) {
    const hour = date.getHours();
    if (hour < 5) return '夜深了，早点休息哦~';
    if (hour < 11) return '早上好，开启美好一天！';
    if (hour < 14) return '中午好，记得休息~';
    if (hour < 18) return '下午好，继续加油！';
    if (hour < 22) return '晚上好，放松一下吧~';
    return '夜深了，注意休息！';
}

function isNight(date: Date) {
    const hour = date.getHours();
    return hour < 6 || hour >= 18;
}

// 打字机激励语句
const MOTIVATION_LIST = [
    '生活是主角，工作只是配角。',
    '工作是为了更好的生活，而不是生活的全部。',
    '别让工作占据了你所有的时间，别忘了享受生活的美好。',
    '生活的意义在于体验与感受，而非无休止的忙碌。',
    '工作可以等待，生活的精彩却不会重来。',
    '别让工作定义你的人生，真正重要的是你如何生活。',
];

function useTypewriter(list: string[], typingSpeed = 80, pause = 1200) {
    const [index, setIndex] = createSignal(0);
    const [display, setDisplay] = createSignal('');
    const [showCursor, setShowCursor] = createSignal(true);
    let charIdx = 0;
    let timer: any;
    let cursorTimer: any;

    function startTyping() {
        setDisplay('');
        charIdx = 0;
        typeNext();
    }
    function typeNext() {
        const text = list[index()];
        if (charIdx <= text.length) {
            setDisplay(text.slice(0, charIdx));
            charIdx++;
            timer = setTimeout(typeNext, typingSpeed);
        } else {
            timer = setTimeout(() => {
                setIndex((i) => (i + 1) % list.length);
            }, pause);
        }
    }
    createEffect(() => {
        startTyping();
        return () => clearTimeout(timer);
    }, [index()]);

    // 闪烁光标
    createEffect(() => {
        cursorTimer = setInterval(() => setShowCursor((v) => !v), 500);
        onCleanup(() => clearInterval(cursorTimer));
    });

    return [display, showCursor] as const;
}

export default function App() {
    // 时间
    const [time, setTime] = createSignal(new Date());
    setInterval(() => setTime(new Date()), 1000);

    // 天气
    const [city, setCity] = createSignal('Beijing');
    const [weather, setWeather] = createSignal<any>(null);
    createEffect(() => {
        if (!WEATHER_API_KEY) return;
        fetch(`${WEATHER_API_URL}?q=${city()}&appid=${WEATHER_API_KEY}&units=metric&lang=zh_cn`)
            .then(res => res.ok ? res.json() : null)
            .then(setWeather);
    });

    // 问候语
    const greeting = () => getGreeting(time());
    const night = () => isNight(time());

    // 打字机激励语
    const [typeText, showCursor] = useTypewriter(MOTIVATION_LIST, 80, 1600);

    // 搜索引擎相关
    const [searchEngine, setSearchEngine] = createSignal<'google' | 'baidu'>('google');
    const [searchInput, setSearchInput] = createSignal('');

    function doSearch() {
        const q = searchInput().trim();
        if (!q) return;
        let url = '';
        if (searchEngine() === 'google') {
            url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
        } else {
            url = `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`;
        }
        window.open(url, '_blank');
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter') doSearch();
    }

    // 书签相关
    const [bookmarks, setBookmarks] = useLocalStorage('center_bookmarks', [
        { name: '百度', url: 'https://www.baidu.com' },
        { name: 'GitHub', url: 'https://github.com' },
    ]);
    const [bookmarkName, setBookmarkName] = createSignal('');
    const [bookmarkUrl, setBookmarkUrl] = createSignal('');
    const [showAdd, setShowAdd] = createSignal(false);
    function addBookmark() {
        if (!bookmarkName() || !bookmarkUrl()) return;
        setBookmarks([...bookmarks(), { name: bookmarkName(), url: bookmarkUrl() }]);
        setBookmarkName('');
        setBookmarkUrl('');
        setShowAdd(false);
    }
    function removeBookmark(idx: number) {
        setBookmarks(bookmarks().filter((_, i) => i !== idx));
    }

    return (
        <>
            <div class={styles.bg} style={{ 'background-image': `url(${BG_IMG})` }} />
            {/* 蒙层：夜晚时加深色半透明 */}
            <Show when={night()}>
                <div class={styles.nightOverlay} />
            </Show>
            <div class={styles.container}>
                {/* 打字机激励语 */}
                <div class={styles.typewriterBox}>
                    <div class={styles.typewriterText}>
                        {typeText()}
                    </div>
                </div>
                {/* 搜索引擎输入区 */}
                <div class={styles.centerBookmarkBox}>
                    <div class={styles.centerInputGroup}>
                        <div class={styles.selectWrapper}>
                            <select
                                class={styles.searchEngineSelect}
                                value={searchEngine()}
                                onInput={e => setSearchEngine(e.currentTarget.value as 'google' | 'baidu')}
                            >
                                <option value="google">Google</option>
                                <option value="baidu">百度</option>
                            </select>
                            <span class={styles.selectArrow}></span>
                        </div>
                        <input
                            value={searchInput()}
                            onInput={e => setSearchInput(e.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="搜索 Google 或百度"
                            class={styles.searchInput}
                            autofocus
                        />
                        <button onClick={doSearch}>搜索</button>
                    </div>
                    {/* 书签展示区，添加书签入口也在这里 */}
                    <div class={styles.centerBookmarkList}>
                        {/* 添加书签卡片 */}
                        <div class={styles.centerBookmarkBlock} style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'center', cursor: 'pointer', opacity: 0.85 }} onClick={() => setShowAdd(true)}>
                            <div class={styles.addIcon}>+</div>
                        </div>
                        {/* 书签卡片 */}
                        <For each={bookmarks()}>{(b, i) =>
                            <div class={styles.centerBookmarkBlock}>
                                <img
                                    class={styles.centerBookmarkFavicon}
                                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(b.url + '&size=128')}`}
                                    alt="favicon"
                                    loading="lazy"
                                />
                                <button class={styles.centerBookmarkDel} onClick={() => removeBookmark(i())}>✕</button>
                            </div>
                        }</For>
                    </div>
                    {/* 书签名称区 */}
                    <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '32px 28px', 'justify-content': 'center', 'margin-top': '8px' }}>
                        <div style={{ width: '104px', 'text-align': 'center', color: '#fff', 'font-weight': 700, 'font-size': '1.02rem', opacity: 0.85 }}>添加书签</div>
                        <For each={bookmarks()}>{(b) =>
                            <div style={{ width: '104px', 'text-align': 'center', color: '#fff', 'font-weight': 700, 'font-size': '1.02rem' }}>{b.name}</div>
                        }</For>
                    </div>
                    {/* 添加书签弹窗 */}
                    <Show when={showAdd()}>
                        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(30,40,60,0.18)', 'z-index': 100, display: 'flex', 'align-items': 'center', 'justify-content': 'center' }} onClick={() => setShowAdd(false)}>
                            <div style={{ background: 'rgba(255,255,255,0.98)', 'border-radius': '22px', 'box-shadow': '0 8px 32px #3a86ff22', padding: '36px 32px', 'min-width': '320px', display: 'flex', 'flex-direction': 'column', gap: '18px' }} onClick={e => e.stopPropagation()}>
                                <input
                                    value={bookmarkName()}
                                    onInput={e => setBookmarkName(e.currentTarget.value)}
                                    placeholder="网站名称"
                                    style={{ padding: '12px 16px', 'border-radius': '12px', border: '1.5px solid #c9d6e3', 'font-size': '1.08rem', 'margin-bottom': '8px' }}
                                />
                                <input
                                    value={bookmarkUrl()}
                                    onInput={e => setBookmarkUrl(e.currentTarget.value)}
                                    placeholder="网址（https://...）"
                                    style={{ padding: '12px 16px', 'border-radius': '12px', border: '1.5px solid #c9d6e3', 'font-size': '1.08rem' }}
                                />
                                <div style={{ display: 'flex', gap: '12px', 'margin-top': '10px' }}>
                                    <button style={{ flex: 1, background: 'linear-gradient(90deg,#3a86ff 0%,#4361ee 100%)', color: '#fff', border: 'none', 'border-radius': '12px', padding: '12px 0', 'font-weight': 700, 'font-size': '1.08rem', cursor: 'pointer' }} onClick={addBookmark}>添加</button>
                                    <button style={{ flex: 1, background: '#e0e7ef', color: '#4a4e69', border: 'none', 'border-radius': '12px', padding: '12px 0', 'font-weight': 700, 'font-size': '1.08rem', cursor: 'pointer' }} onClick={() => setShowAdd(false)}>取消</button>
                                </div>
                            </div>
                        </div>
                    </Show>
                </div>
                <div class={styles.bottomBar}>
                    <div class={styles.timeBox}>{time().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class={styles.greeting}>{greeting()}</div>
                    <Show when={WEATHER_API_KEY}>
                        <div class={styles.weatherBar}>
                            <input
                                value={city()}
                                onInput={e => setCity(e.currentTarget.value)}
                                class={styles.cityInput}
                                placeholder="城市"
                                style={{ width: '70px', 'margin-right': '8px', background: 'rgba(255,255,255,0.5)' }}
                            />
                            <Show when={weather()} fallback={<span>加载中...</span>}>
                                <span>
                                    {weather()?.name} {weather()?.weather?.[0]?.description} {weather()?.main?.temp}°C
                                </span>
                            </Show>
                        </div>
                    </Show>
                </div>
            </div>
        </>
    );
}
