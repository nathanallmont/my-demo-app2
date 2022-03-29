import {
  createSolidDataset,
  createThing,
  setThing,
  addUrl,
  addStringNoLocale,
  saveSolidDatasetAt,
  getSolidDataset,
  getThingAll,
  getStringNoLocale,
  removeThing,
  FetchError
} from "@inrupt/solid-client";

import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  fetch
} from "@inrupt/solid-client-authn-browser";

import { SCHEMA_INRUPT, RDF, AS } from "@inrupt/vocab-common-rdf";

const buttonLogin = document.querySelector("#btnLogin");
const buttonCreate = document.querySelector("#btnCreate");
buttonCreate.disabled=true;
const labelCreateStatus = document.querySelector("#labelCreateStatus");

// 1a. Start Login Process. Call login() function.
function startLogin() {
  return login({

    oidcIssuer: "https://broker.pod.inrupt.com",

    redirectUrl: window.location.href,
    clientName: "Getting started app"
  });
}

// 1b. Login Redirect.
// When redirected after login, call handleIncomingRedirect() function to
// finish the login process by retrieving session information.
async function finishLogin() {
    await handleIncomingRedirect();
    const session = getDefaultSession();
    if (session.info.isLoggedIn) {
      // Update the page with the status.
      document.getElementById("labelStatus").textContent = `Logged in with WebID ${session.info.webId}`;
      document.getElementById("labelStatus").setAttribute("role", "alert");
      // Enable Create button
      buttonCreate.disabled=false;
    }
}

// The example has the login redirect back to the index.html.
// finishLogin() calls the function to process login information.
// If the function is called when not part of the login redirect, the function is a no-op.
finishLogin();

// 2. Create the Reading List
async function createList() {
  labelCreateStatus.textContent = "";
  const podUrl = document.getElementById("PodURL").value;
 
  // For simplicity and brevity, this tutorial hardcodes the SolidDataset URL.
  // In practice, you should add a link to this resource in your profile that applications can follow.
  const readingListUrl = `${podUrl}/getting-started/readingList/myList`;
 
  let titles = document.getElementById("titles").value.split("\n");

  // Fetch or create a new reading list.
  let myReadingList;

  try {
    // Attempt to fetch the reading list in case it already exists.
    myReadingList = await getSolidDataset(readingListUrl, { fetch: fetch });
    // Clear the list to override the whole list
    let titles = getThingAll(myReadingList);
    titles.forEach(title => {
     myReadingList = removeThing(myReadingList, title);
    });
  } catch (error) {
    if (typeof error.statusCode === "number" && error.statusCode === 404) {
      // if not found, create a new SolidDataset (i.e., the reading list)
      myReadingList = createSolidDataset();
    } else {
      console.error(error.message);
    }
  }

  // Add titles to the Dataset
  for (let i = 0; i < titles.length; i++) {
    let title = createThing({name: "title" + i});
    title = addUrl(title, RDF.type, AS.Article);
    title = addStringNoLocale(title, SCHEMA_INRUPT.name, titles[i]);
    myReadingList = setThing(myReadingList, title);
  }

  try {
     
    // Save the SolidDataset 
    let savedReadingList = await saveSolidDatasetAt(
      readingListUrl,
      myReadingList,
      { fetch: fetch }
    );

    labelCreateStatus.textContent = "Saved";

    // Refetch the Reading List
    savedReadingList = await getSolidDataset(
      readingListUrl,
      { fetch: fetch }
    );

    let items = getThingAll(savedReadingList);

    let listcontent="";
    for (let i = 0; i < items.length; i++) {
      let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name);
      if (item !== null) {
          listcontent += item + "\n";
      }
    }

    document.getElementById("savedtitles").value = listcontent;

  } catch (error) {
    console.log(error);
    labelCreateStatus.textContent = "Error" + error;
    labelCreateStatus.setAttribute("role", "alert");
  } 
}

buttonLogin.onclick = function() {  
  startLogin();
};

buttonCreate.onclick = function() {  
  createList();
};