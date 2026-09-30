/* =========================================================

   BASIS PROFILE JS

========================================================= */


const PROFILE_STORAGE_KEY = "basisRepresentativeProfile";

/* ADMIN-ASSIGNED ROLE */

const ROLE_STORAGE_KEY = "basisAssignedRole";



/* =========================================================

   BAGAC BARANGAYS

========================================================= */


const BAGAC_BARANGAYS = [

    "Bagumbayan",

    "Banawang",

    "Binuangan",

    "Binukawan",

    "Ibaba",

    "Ibis",

    "Pag-asa",

    "Parang",

    "Paysawan",

    "Quinawan",

    "San Antonio",

    "Saysain",

    "Tabing-ilog",

    "Atilano Ricardo"

];






/* =========================================================

   DEFAULT PROFILE

========================================================= */


const DEFAULT_PROFILE = {

    registrationStatus: "approved",


    /* ADMIN ASSIGNED ROLE */

    role: "REPRESENTATIVE",


    controlNumber: "",


    givenName: "JUAN",

    surname: "DELA CRUZ",

    middleName: "",

    suffix: "",


    sex: "",

    birthday: "",

    contact: "",

    email: "",

    religion: "",


    municipality: "BAGAC",

    barangay: "",


    school: "",

    program: "",

    yearLevel: "",


    studentStatus: "ACTIVE",


    profilePhoto: "",


    father: {

        given: "",

        surname: "",

        middle: "",

        suffix: "",

        contact: ""

    },


    mother: {

        given: "",

        surname: "",

        middle: "",

        suffix: "",

        contact: ""

    },


    siblings: []

};



/* =========================================================

   HELPERS

========================================================= */


function getProfile() {


    const saved =

        localStorage.getItem(PROFILE_STORAGE_KEY);


    if (!saved) {

        return structuredClone(DEFAULT_PROFILE);

    }


    try {


        return {

            ...structuredClone(DEFAULT_PROFILE),

            ...JSON.parse(saved)

        };


    } catch (error) {


        return structuredClone(DEFAULT_PROFILE);

    }

}



function saveProfile(profile) {


    localStorage.setItem(

        PROFILE_STORAGE_KEY,

        JSON.stringify(profile)

    );

}



function $(id) {

    return document.getElementById(id);

}



/* =========================================================

   BARANGAY OPTIONS

========================================================= */


function populateBarangays(selected = "") {


    const barangay = $("barangay");


    if (!barangay) return;


    barangay.innerHTML =

        '<option value="">SELECT BARANGAY</option>';


    BAGAC_BARANGAYS.forEach(name => {


        const option =

            document.createElement("option");


        option.value = name;

        option.textContent = name;


        if (

            name.toLowerCase() ===

            selected.toLowerCase()

        ) {

            option.selected = true;

        }


        barangay.appendChild(option);

    });

}



/* =========================================================

   AUTOMATIC LOCATION

========================================================= */


/* =========================================================

   CONTROL NUMBER

========================================================= */


function generateControlNumber() {


    const year =

        new Date().getFullYear();


    const random =

        Math.floor(

            100000 +

            Math.random() * 900000

        );


    return `BASIS-${year}-${random}`;

}



function ensureControlNumber(profile) {


    if (

        profile.registrationStatus === "approved" &&

        !profile.controlNumber

    ) {


        profile.controlNumber =

            generateControlNumber();


        saveProfile(profile);

    }


    return profile.controlNumber || "";

}



/* =========================================================

   ADMIN-ASSIGNED ROLE

========================================================= */


/*

    Gets the role assigned by admin.


    The representative/student cannot edit

    this from the profile page.

*/


function getAssignedRole(profile) {


    const storedRole =

        localStorage.getItem(

            ROLE_STORAGE_KEY

        );


    const role =

        storedRole ||

        profile.role ||

        "REPRESENTATIVE";


    return String(role)

        .trim()

        .toUpperCase() ||

        "REPRESENTATIVE";

}



/*

    ADMIN SIDE FUNCTION


    Example:


        setAssignedRole("REPRESENTATIVE");


    or:


        setAssignedRole("ISKOLAR");


    In the real system this should eventually

    come from the PHP/database admin module.

*/


function setAssignedRole(role) {


    const normalized =

        String(role || "")

            .trim()

            .toUpperCase();


    if (!normalized) return;


    localStorage.setItem(

        ROLE_STORAGE_KEY,

        normalized

    );


    const profile =

        getProfile();


    profile.role =

        normalized;


    saveProfile(profile);


    updateProfileHeader(profile);

}



/* =========================================================

   DISPLAY NAME / LOCATION / STATUS / ROLE

========================================================= */


function updateProfileHeader(profile) {


    const fullName = [

        profile.givenName,

        profile.middleName,

        profile.surname,

        profile.suffix

    ]

        .filter(Boolean)

        .join(" ")

        .trim();


    $("displayFullName").textContent =

        fullName ||

        "REGISTERED REPRESENTATIVE";



    /* CONTROL NUMBER */


    const controlNumber =

        $("displayControlNumber");


    if (

        profile.registrationStatus ===

        "approved"

    ) {


        const number =

            ensureControlNumber(profile);


        controlNumber.textContent =

            number

                ? `CONTROL NO: ${number}`

                : "";


        controlNumber.style.display =

            number

                ? "inline-flex"

                : "none";


    } else {


        controlNumber.textContent = "";

        controlNumber.style.display = "none";

    }



    /* LOCATION */



    /* ACCOUNT STATUS */


    const status =

        profile.registrationStatus ===

        "approved"


            ? (

                profile.studentStatus ||

                "ACTIVE"

              ).toUpperCase()


            : "PENDING";


    $("statusTitle").textContent =

        status;


    $("statusTitle").classList.remove(

        "inactive",

        "pending"

    );


    if (status === "INACTIVE") {


        $("statusTitle")

            .classList.add("inactive");

    }


    if (status === "PENDING") {


        $("statusTitle")

            .classList.add("pending");

    }



    /* ADMIN-ASSIGNED ROLE */


    const assignedRole =

        getAssignedRole(profile);


    if ($("displayRole")) {


        $("displayRole").textContent =

            assignedRole;

    }


    if ($("headerWelcomeRole")) {


        $("headerWelcomeRole").textContent =

            `MABUHAY, ${assignedRole}!`;

    }}



/* =========================================================

   ADMIN APPROVAL / REGISTRATION STATE

========================================================= */


function setRegistrationApproval(approved) {


    const profile =

        getProfile();


    profile.registrationStatus =

        approved

            ? "approved"

            : "pending";


    if (!approved) {


        profile.controlNumber = "";


        profile.studentStatus =

            "PENDING";


    } else {


        profile.studentStatus =

            profile.studentStatus ===

            "PENDING"


                ? "ACTIVE"


                : (

                    profile.studentStatus ||

                    "ACTIVE"

                );


        ensureControlNumber(profile);

    }


    saveProfile(profile);


    loadPersonalForm(profile);

}



/* =========================================================

   LOAD PERSONAL FORM

========================================================= */


function loadPersonalForm(profile) {


    $("givenName").value =

        profile.givenName || "";


    $("surname").value =

        profile.surname || "";


    $("middleName").value =

        profile.middleName || "";


    $("suffix").value =

        profile.suffix || "";



    $("sex").value =

        profile.sex || "";


    $("birthday").value =

        profile.birthday || "";


    $("contact").value =

        profile.contact || "";


    $("email").value =

        profile.email || "";


    $("religion").value =

        profile.religion || "";



    /* MUNICIPALITY IS AUTOMATIC */


    $("municipality").value =

        "BAGAC";



    /* BARANGAY */


    populateBarangays(

        profile.barangay || ""

    );



    \n    $("school").value =

        profile.school || "";


    $("program").value =

        profile.program || "";


    $("yearLevel").value =

        profile.yearLevel || "";



    /* PROFILE PHOTO */


    if (profile.profilePhoto) {


        $("profilePhoto").src =

            profile.profilePhoto;

    }



    updateProfileHeader(profile);

}



/* =========================================================

   LOAD FAMILY FORM

========================================================= */


function loadFamilyForm(profile) {


    $("fatherGiven").value =

        profile.father?.given || "";


    $("fatherSurname").value =

        profile.father?.surname || "";


    $("fatherMiddle").value =

        profile.father?.middle || "";


    $("fatherSuffix").value =

        profile.father?.suffix || "";


    $("fatherContact").value =

        profile.father?.contact || "";



    $("motherGiven").value =

        profile.mother?.given || "";


    $("motherSurname").value =

        profile.mother?.surname || "";


    $("motherMiddle").value =

        profile.mother?.middle || "";


    $("motherSuffix").value =

        profile.mother?.suffix || "";


    $("motherContact").value =

        profile.mother?.contact || "";



    const container =

        $("siblingsContainer");


    container.innerHTML = "";



    const siblings =

        profile.siblings?.length

            ? profile.siblings

            : [{}];



    siblings.forEach(sibling => {


        addSiblingRow(sibling);


    });

}



/* =========================================================

   ADD SIBLING

========================================================= */


function addSiblingRow(data = {}) {


    const row =

        document.createElement("div");


    row.className =

        "sibling-grid-row";


    row.innerHTML = `


        <div class="form-group">


            <label>GIVEN NAME:</label>


            <input

                type="text"

                class="sibling-given"

                value="${escapeHtml(

                    data.given || ""

                )}"

            >


        </div>



        <div class="form-group">


            <label>SURNAME:</label>


            <input

                type="text"

                class="sibling-surname"

                value="${escapeHtml(

                    data.surname || ""

                )}"

            >


        </div>



        <div class="form-group">


            <label>MIDDLE NAME:</label>


            <input

                type="text"

                class="sibling-middle"

                value="${escapeHtml(

                    data.middle || ""

                )}"

            >


        </div>



        <div class="form-group col-suffix">


            <label>SUFFIX:</label>


            <input

                type="text"

                class="sibling-suffix"

                value="${escapeHtml(

                    data.suffix || ""

                )}"

            >


        </div>


    `;



    $("siblingsContainer")

        .appendChild(row);

}



/* =========================================================

   ESCAPE HTML

========================================================= */


function escapeHtml(value) {


    return String(value)


        .replaceAll(

            "&",

            "&amp;"

        )


        .replaceAll(

            "<",

            "&lt;"

        )


        .replaceAll(

            ">",

            "&gt;"

        )


        .replaceAll(

            '"',

            "&quot;"

        )


        .replaceAll(

            "'",

            "&#039;"

        );

}



/* =========================================================

   EDIT MODE

========================================================= */


let editMode = false;



function setEditMode(enabled) {


    editMode = enabled;


    const page =

        document.querySelector(

            ".profile-page-main"

        );


    if (page) {


        page.classList.toggle(

            "editing",

            enabled

        );

    }



    /*

        These fields can be edited

        by the representative.

    */


    const editableInputs = [


        $("givenName"),

        $("surname"),

        $("middleName"),

        $("suffix"),

        $("birthday"),

        $("contact"),

        $("email"),

        $("religion"),

        $("school"),

        $("program")


    ];



    editableInputs.forEach(input => {


        if (!input) return;


        input.readOnly =

            !enabled;


        input.classList.toggle(

            "editable",

            enabled

        );


    });



    /* SELECT FIELDS */


    $("sex").disabled =

        !enabled;


    $("barangay").disabled =

        !enabled;


    $("yearLevel").disabled =

        !enabled;



    /*

        Municipality is automatic.

    */


    $("municipality").disabled =

        true;



    



    /*

        EDIT BUTTON TEXT

    */


    $("editProfileBtn").textContent =


        enabled


            ? "CANCEL EDIT"


            : "EDIT PROFILE";

}



/* =========================================================

   COLLECT PERSONAL DATA

========================================================= */


function collectPersonalData() {


    const currentProfile =

        getProfile();


    return {


        givenName:

            $("givenName")

                .value

                .trim(),


        surname:

            $("surname")

                .value

                .trim(),


        middleName:

            $("middleName")

                .value

                .trim(),


        suffix:

            $("suffix")

                .value

                .trim(),



        sex:

            $("sex").value,


        birthday:

            $("birthday").value,


        contact:

            $("contact")

                .value

                .trim(),


        email:

            $("email")

                .value

                .trim(),


        religion:

            $("religion")

                .value

                .trim(),



        /* MUNICIPALITY ALWAYS BAGAC */


        municipality:

            "BAGAC",



        barangay:

            $("barangay").value,



        



        school:

            $("school")

                .value

                .trim(),


        program:

            $("program")

                .value

                .trim(),


        yearLevel:

            $("yearLevel").value

    };

}



/* =========================================================

   COLLECT FAMILY DATA

========================================================= */


function collectFamilyData() {


    const siblings = [];



    document

        .querySelectorAll(

            "#siblingsContainer .sibling-grid-row"

        )

        .forEach(row => {


            siblings.push({


                given:

                    row.querySelector(

                        ".sibling-given"

                    )?.value.trim() || "",


                surname:

                    row.querySelector(

                        ".sibling-surname"

                    )?.value.trim() || "",


                middle:

                    row.querySelector(

                        ".sibling-middle"

                    )?.value.trim() || "",


                suffix:

                    row.querySelector(

                        ".sibling-suffix"

                    )?.value.trim() || ""


            });


        });



    return {


        father: {


            given:

                $("fatherGiven")

                    .value

                    .trim(),


            surname:

                $("fatherSurname")

                    .value

                    .trim(),


            middle:

                $("fatherMiddle")

                    .value

                    .trim(),


            suffix:

                $("fatherSuffix")

                    .value

                    .trim(),


            contact:

                $("fatherContact")

                    .value

                    .trim()


        },



        mother: {


            given:

                $("motherGiven")

                    .value

                    .trim(),


            surname:

                $("motherSurname")

                    .value

                    .trim(),


            middle:

                $("motherMiddle")

                    .value

                    .trim(),


            suffix:

                $("motherSuffix")

                    .value

                    .trim(),


            contact:

                $("motherContact")

                    .value

                    .trim()


        },



        siblings


    };

}



/* =========================================================

   SAVE PROFILE

========================================================= */


async function saveCurrentProfile() {


    const profile =

        getProfile();



    Object.assign(


        profile,


        collectPersonalData(),


        collectFamilyData()


    );



    saveProfile(profile);
    try { await window.BASISAuth.saveProfile(profile, PROFILE_STORAGE_KEY); } catch (error) { alert(error.message); return; }



    updateProfileHeader(

        profile

    );



    setEditMode(false);



    alert(

        "Profile saved successfully."

    );

}



/* =========================================================

   SUBVIEW

========================================================= */


function showSubView(viewId) {


    const personalView =

        document.getElementById(

            "view-profile"

        );


    const familyView =

        document.getElementById(

            "view-profile-family"

        );



    if (!personalView || !familyView) {


        console.error(

            "Profile views are missing from profile.html."

        );


        return;

    }



    const target =


        viewId ===

        "view-profile-family"


            ? familyView


            : viewId ===

              "view-profile"


                ? personalView


                : null;



    if (!target) {


        console.error(

            "Unknown profile view:",

            viewId

        );


        return;

    }



    /* Hide both views */


    [personalView, familyView]

        .forEach(view => {


            view.classList.remove(

                "active"

            );


            view.style.setProperty(

                "display",

                "none",

                "important"

            );


        });



    /* Show target */


    target.classList.add(

        "active"

    );


    target.style.setProperty(

        "display",

        "block",

        "important"

    );



    /* FAMILY */


    if (

        viewId ===

        "view-profile-family"

    ) {


        try {


            const profile =

                getProfile();


            loadFamilyForm(

                profile

            );


        } catch (error) {


            console.error(

                "Family page loading error:",

                error

            );

        }



        const scrollArea =

            familyView.querySelector(

                ".family-scroll-area"

            );



        if (scrollArea) {


            requestAnimationFrame(() => {


                scrollArea.scrollTop = 0;


            });

        }

    }



    /* PERSONAL */


    if (

        viewId ===

        "view-profile"

    ) {


        try {


            loadPersonalForm(

                getProfile()

            );


        } catch (error) {


            console.error(

                "Personal page loading error:",

                error

            );

        }

    }

}



/* =========================================================

   PROFILE PHOTO

========================================================= */


function handleProfilePhoto() {


    const file =

        $("profilePhotoInput")

            .files[0];



    if (!file) return;



    const reader =

        new FileReader();



    reader.onload =

        function(event) {


            $("profilePhoto").src =

                event.target.result;



            const profile =

                getProfile();



            profile.profilePhoto =

                event.target.result;



            saveProfile(

                profile

            );


        };



    reader.readAsDataURL(

        file

    );

}



/* =========================================================

   EVENT LISTENERS

========================================================= */


document.addEventListener(

    "DOMContentLoaded",

    function() {


        /* Hide the small top-right profile avatar on Profile page */

        const headerAvatar =

            document.querySelector(".profile-avatar-wrapper");


        if (headerAvatar) {

            headerAvatar.style.setProperty(

                "display",

                "none",

                "important"

            );

        }


        const profile =

            getProfile();



        loadPersonalForm(

            profile

        );


        loadFamilyForm(

            profile

        );



        function on(

            id,

            event,

            handler

        ) {


            const element =

                $(id);


            if (element) {


                element.addEventListener(

                    event,

                    handler

                );

            }

        }



        /* EDIT PROFILE */


        on(

            "editProfileBtn",

            "click",

            function() {


                if (editMode) {


                    loadPersonalForm(

                        getProfile()

                    );


                    setEditMode(

                        false

                    );


                } else {


                    setEditMode(

                        true

                    );

                }

            }

        );



        /* BARANGAY */


        on(

            "barangay",

            "change",

            function() {


                $("municipality").value =

                    "BAGAC";

            }

        );



        /* ADD SIBLING */


        on(

            "addSiblingBtn",

            "click",

            function() {


                addSiblingRow();

            }

        );



        /* SAVE PROFILE */


        on(

            "saveProfileBtn",

            "click",

            saveCurrentProfile

        );



        /* PROFILE PHOTO */


        on(

            "profilePhotoInput",

            "change",

            handleProfilePhoto

        );



        /* START WITH VIEW MODE */


        setEditMode(

            false

        );


    }

);
