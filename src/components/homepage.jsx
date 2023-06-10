import './homepage.css'

function Homepage() {
    document.body.style = { background: '#000000' };
    return (
        <div>
            <div class='nav-box'>
                <nav class='nav-home'>
                    <img src="\13416 1.png" alt="nav techno image" class='nav-box-img' />
                    <ul>
                        <li>Home</li>
                        <li>Blog</li>
                        <li>Work</li>
                    </ul>
                </nav>
            </div>

            <div class='ellipsesparent'>
                <img src="\1ellipses.png" id='ellipses1' />
                <img src="\2ellipses.png" id='ellipses2' />
                <img src='\3ellipses.png' id='ellipses3' />
            </div>
            <div>
                <div class='rec-1-home'></div>
                <div class='rec-2-home'></div>
                <div class='rec-3-home'></div>
                <div class='text-box-home'>
                    <span class='home-intro-big'>Hi I am,<br />Adesh Tamrakar</span>
                    <span class='home-intro-small'>I'm a full-stack web developer skilled in ReactJs, Angular, NodeJs, RDBMS, NoSQL and AWS. From interactive user interfaces to performant backends, I create seamless web solutions.<br /><br />Let's elevate your online presence with expertise and a relentless pursuit of excellence.</span>
                </div>
            </div>
        </div>
    )
}

export default Homepage;