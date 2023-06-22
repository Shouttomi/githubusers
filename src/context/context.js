import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockfollowers2";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubuser, setgithubuser] = useState(mockUser);
  const [repos, setrepos] = useState(mockRepos);
  const [followers, setfollowers] = useState(mockFollowers);

  //request loading
  const [requests, setrequests] = useState(0);
  const [isloading, setisloading] = useState(false);

  //error
  const [error, seterror] = useState({ show: false, msg: "" });

  const searchgithubuser = async (user) => {
    toggleerror();

    setisloading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );

    if (response) {
      setgithubuser(response.data);
      const { login, followers_url } = response.data;

      //Promise.allSettled is gonna fire when all of
      //the promises are settled

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          const status = "fulfilled";

          if (repos.status === status) {
            setrepos(repos.value.data);
          }

          if (followers.status === status) {
            setfollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleerror(true, "there is no user with that username");
    }
    checkrequests();
    setisloading(false);
  };

  //check rate
  const checkrequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setrequests(remaining);

        if (remaining === 0) {
          //throw an error
          toggleerror(true, "you have exceeded your hourly rate limit");
        }
      })
      .catch((err) => console.log(err));
  };

  //we are setting the default values of toggleerror
  //toggleerror(show = false, msg = '') so when we call
  //toggleerror() it will have values toggleerror(false,'')
  function toggleerror(show = false, msg = "") {
    seterror({ show, msg });
  }

  //error
  useEffect(checkrequests, []);
  return (
    <GithubContext.Provider
      value={{
        githubuser,
        repos,
        followers,
        requests,
        error,
        searchgithubuser,
        isloading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
