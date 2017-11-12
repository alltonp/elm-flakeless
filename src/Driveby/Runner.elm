module Driveby.Runner exposing (run)

import Date exposing (..)
import Dict exposing (..)
import Driveby exposing (..)
import Driveby.Model exposing (..)
import Driveby.Runner.Model exposing (..)
import Fifo exposing (..)
import Html exposing (..)
import Maybe.Extra as MaybeExtra
import Task


run : Suite -> (Request -> Cmd Msg) -> ((Response -> Msg) -> Sub Msg) -> Program Flags Model Msg
run suite requestsPort responsesPort =
    Html.programWithFlags
        { init = init
        , view = view
        , update = update requestsPort
        , subscriptions = subscriptions responsesPort
        }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( Model flags
        (Fifo.fromList
            [ --            ICommand "function(){ console.log('hi') }"
              --            , ICommand "function(){ console.log('low') }"
              --            , ICommand "function(){ urlToGoto='http://www.google.com'; }"
              --            , ICommand "function(){ console.log(urlToGoto) }"
              --              ICommand "open('http://www.google.com')"
              --            ,
              --              ICommand (String.split "\n" """function goto(page, context, url) {
              --                            page.open(url, function(status) {
              --                                                     if (status !== 'success') { respond(page, context, [status + ' for ' + url]) }
              --                                                     else { respond(page, context, []) }
              --                                                   });
              --                                                 }""" |> String.join "")
              --TIP: this one fully works ...
              --              ICommand """function goto(page, context, url) { page.open(url, function(status) { if (status !== 'success') { respond(page, context, [status + ' for ' + url]) } else { respond(page, context, []) } }); }; goto(page, null, "http://www.google.com");"""
              --TIP: this one works inline, without the function, whoop!
              ICommand """page.open("http://www.google.com", function(status) { if (status !== 'success') { respond(page, null, [status + ' for ' + "http://www.google.com"]) } else { respond(page, null, []) } });"""
            , ICommand """page.open("http://www.bbc.co.uk/news", function(status) { if (status !== 'success') { respond(page, null, [status + ' for ' + "http://www.bbc.co.uk/news"]) } else { respond(page, null, []) } });"""

            --TODO: need to escape these too ... '
            --              ICommand (String.split "\n" """function goto(page, context, url) {
            --                                          page.open(url, function(status) {
            --                                                                   if (status !== 'success') { respond(page, context, [status + ' for ' + url]) }
            --                                                                   else { respond(page, context, []) }
            --                                                                 });
            --                                                               }""" |> List.map (\l -> "'" ++ l ++ "'") |> String.join " + ")
            --            ,
            --            , ICommand
            --                """goto(page, null, "http://www.google.com");"""
            --              ICommand "function goto(page, context, url) { page.open(url, function(status) { if (status !== 'success') { respond(page, context, [status + ' for ' + url]) } else { respond(page, context, []) } });  }"
            --            , ICommand "goto(page, null, 'http://www.google.com');"
            --              ICommand "function(){ this.open('http://www.google.com', function(status) { console.log(status); }) }"
            --            , ICommand "function(){ open(urlToGoto); }"
            --            , ICommand "function(){ console.log(this); }"
            --            , ICommand "function(){ this.open('http://www.google.com', function(status) { console.log(status); }); }"
            --            , ICommand "this.open('http://www.google.com', function(status) { if (status !== 'success') { respond(page, null, [status + ' for ' + 'url']) } else { respond(page, null, []) }  });"
            --            , ICommand "function(){ console.log(this.title); }"
            --            , ICommand "function(){ console.log(this.url); }"
            --            , ICommand "function(){ return this.title; }"
            --            , ICommand "console.log(page.url);"
            --            , ICommand "function(){ return 'hey'; }"
            --            , ICommand "function(){ return document.documentURI; }"
            ]
        )
    , go
    )


go : Cmd Msg
go =
    Task.perform Go Date.now


subscriptions : ((Response -> Msg) -> Sub Msg) -> Model -> Sub Msg
subscriptions responsesPort model =
    responsesPort Process


update : (Request -> Cmd Msg) -> Msg -> Model -> ( Model, Cmd Msg )
update requestsPort msg model =
    case msg of
        Go x ->
            let
                ( maybeCommand, queue_ ) =
                    Fifo.remove model.queue

                cmd =
                    case maybeCommand of
                        Just c ->
                            requestsPort (Request c.js)

                        Nothing ->
                            Cmd.none

                --maybe later, sleep for X (a-la debounce and then send Go again)
            in
            ( { model | queue = queue_ }, cmd )

        Process response ->
            let
                successful =
                    List.isEmpty response.failures

                queue_ =
                    if not successful then
                        Fifo.insert (ICommand response.js) model.queue
                    else
                        model.queue

                cmd =
                    go
            in
            ( { model | queue = queue_ }, cmd )



--        _ ->
--            ( model, Cmd.none )


view : Model -> Html Msg
view model =
    div [] []
